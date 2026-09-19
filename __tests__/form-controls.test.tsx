import {useState} from 'react';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {NativeSelect,NativeSelectOption} from '@/components/ui/native-select';
import {Checkbox} from '@/components/ui/checkbox';
import {Label} from '@/components/ui/label';
import {Button} from '@/components/ui/button';

test('shared controls preserve required validation, labels, selection and submitted values',async()=>{
  const save=jest.fn();
  render(<form onSubmit={event=>{event.preventDefault();save(Object.fromEntries(new FormData(event.currentTarget)));}}><Label>Email<Input name="email" type="email" required/></Label><Label>Plan<NativeSelect name="plan" defaultValue="monthly"><NativeSelectOption value="monthly">Monthly</NativeSelectOption><NativeSelectOption value="annual">Annual</NativeSelectOption></NativeSelect></Label><Label>Notes<Textarea name="notes"/></Label><Button type="submit">Save</Button></form>);
  const user=userEvent.setup();
  await user.click(screen.getByRole('button',{name:'Save'}));
  expect(save).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText('Email'),'learner@example.test');
  await user.selectOptions(screen.getByLabelText('Plan'),'annual');
  await user.type(screen.getByLabelText('Notes'),'Revision plan');
  await user.click(screen.getByRole('button',{name:'Save'}));
  expect(save).toHaveBeenCalledWith({email:'learner@example.test',plan:'annual',notes:'Revision plan'});
});

test('checkbox label toggles a controlled value and disabled choice stays unchanged',async()=>{
  function Choices(){const [checked,setChecked]=useState(false);return <><Label><Checkbox checked={checked} onCheckedChange={setChecked}/>Include practice</Label><Label><Checkbox disabled/>Unavailable course</Label></>;}
  render(<Choices/>);const user=userEvent.setup();
  await user.click(screen.getByText('Include practice'));
  expect(screen.getByRole('checkbox',{name:'Include practice'})).toBeChecked();
  await user.click(screen.getByText('Unavailable course'));
  expect(screen.getByRole('checkbox',{name:'Unavailable course'})).not.toBeChecked();
});
