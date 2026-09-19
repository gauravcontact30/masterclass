/** Meaning-based categories keep locally generated PNGs useful for AI vocabulary too. */
export function vocabularyIcon(word:string,meaning:string):{src:string;alt:string} {
  const text=`${word} ${meaning}`.toLowerCase();
  const icons:[RegExp,string,string][]=[
    [/idempoten|repeat.*same|repeated.*same/,'repeat','Repeated action with the same result'],
    [/determin|predictab|consistent.*result/,'equal','Consistent, predictable results'],
    [/encapsulat|contain|hiding.*detail/,'box','Details contained inside a boundary'],
    [/trade.?off|compromise|balanc/,'balance','Balancing benefits and costs'],
    [/secur|protect|resilien|reliab|robust|mitigat/,'shield','Protection and reliability'],
    [/collabor|stakeholder|team|delegat|consensus/,'team','People working together'],
    [/scalab|capacity|layer|modular|abstract/,'layers','Organized layers that can grow'],
    [/latency|efficien|perform|speed|throughput|optimi/,'speed','Speed and efficiency'],
    [/orchestrat|workflow|process|integrat|interoperab/,'workflow','Connected steps in a process'],
    [/priorit|objective|align|goal|strateg/,'target','Focus on a shared objective'],
    [/innovat|insight|idea|clarity|understand/,'idea','A clear idea or insight'],
  ];
  const match=icons.find(([pattern])=>pattern.test(text));
  return {src:`/images/vocabulary/${match?.[1]??'meaning'}.png`,alt:match?.[2]??`Meaning of ${word}`};
}
