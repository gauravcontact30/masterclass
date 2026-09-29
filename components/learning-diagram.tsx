import { useId } from "react";
import type { LearningDiagram as Diagram } from "@/lib/pro-learn/learning-diagram";
import styles from "./learning-diagram.module.css";

const colors = { blue: "#2563a6", green: "#237452", purple: "#7650a5", orange: "#a95719", ink: "#303846" };

export function LearningDiagram({ diagram }: { diagram: Diagram }) {
  const id = useId();
  return <figure className={styles.figure}>
    <figcaption><span>Visual guide</span><h3>{diagram.title}</h3></figcaption>
    <div className={styles.canvas}>
      <svg viewBox="0 0 640 360" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>{diagram.title}</title>
        <desc id={`${id}-desc`}>{diagram.description}</desc>
        <defs>{Object.entries(colors).map(([tone, color]) => <marker key={tone} id={`${id}-${tone}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={color} /></marker>)}</defs>
        {diagram.elements.map((element, index) => {
          const color = colors[element.tone];
          switch (element.kind) {
            case "line": return <line key={index} x1={element.x1} y1={element.y1} x2={element.x2} y2={element.y2} stroke={color} strokeWidth="2" markerEnd={element.arrow ? `url(#${id}-${element.tone})` : undefined} />;
            case "circle": return <circle key={index} cx={element.x} cy={element.y} r={element.radius} stroke={color} strokeWidth="2" fill={color} fillOpacity="0.07" />;
            case "rect": return <rect key={index} x={element.x} y={element.y} width={element.width} height={element.height} rx="8" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.06" />;
            case "text": return <text key={index} x={element.x} y={element.y} fill={color} fontSize="16" fontFamily="system-ui, sans-serif">{element.text}</text>;
          }
        })}
      </svg>
    </div>
    <p>{diagram.description}</p>
    <p className={styles.takeaway}>{diagram.takeaway}</p>
  </figure>;
}
