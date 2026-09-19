// Rasterize our existing Lucide icon system into small, crisp local PNG assets.
const fs=require('node:fs/promises');
const path=require('node:path');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const sharp=require('sharp');
const icons=require('lucide-react');
const choices={repeat:'Repeat2',equal:'Equal',box:'Box',balance:'Scale',shield:'ShieldCheck',team:'Users',layers:'Layers',speed:'Gauge',workflow:'Workflow',target:'Target',idea:'Lightbulb',meaning:'BookOpen'};
async function main(){
  const output=path.resolve(__dirname,'../public/images/vocabulary');
  await fs.mkdir(output,{recursive:true});
  for(const [name,icon] of Object.entries(choices)){
    const svg=renderToStaticMarkup(React.createElement(icons[icon],{size:96,color:'#527c69',strokeWidth:1.5}));
    await sharp(Buffer.from(svg)).png().toFile(path.join(output,`${name}.png`));
  }
  console.log(`Generated ${Object.keys(choices).length} vocabulary PNG icons.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
