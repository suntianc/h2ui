interface ComponentNodeData {
  name: string;
  tag: string;
  children: ComponentNodeData[];
  isRepeated?: boolean;
  repeatCount?: number;
}

interface ComponentNodeProps {
  node: ComponentNodeData;
  onSelect: (name: string) => void;
  selected?: string;
}

export function ComponentNode({ node, onSelect, selected }: ComponentNodeProps) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="component-node" onClick={() => onSelect(node.name)}>
      <div className={`node-header ${selected === node.name ? 'selected' : ''}`}>
        <span className="node-tag">&lt;{node.tag} /&gt;</span>
        <span className="node-name">{node.name}</span>
        {node.isRepeated && (
          <span className="repeated-badge">
            repeated {node.repeatCount ? `x${node.repeatCount}` : ''}
          </span>
        )}
      </div>
      {hasChildren && (
        <div className="children">
          {node.children.map((child, i) => (
            <ComponentNode
              key={i}
              node={child}
              onSelect={onSelect}
              selected={selected}
            />
          ))}
        </div>
      )}
    </div>
  );
}
