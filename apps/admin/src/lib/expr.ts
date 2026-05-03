import type { ExprNode, ExprLiteral, ExprOp } from '@/types/schema';

const BINARY_OPS: Partial<Record<ExprOp, string>> = {
  add: '+',
  subtract: '-',
  multiply: '*',
  divide: '/',
  eq: '==',
  neq: '!=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
};

function formatLiteral(v: ExprLiteral): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return `[${v.map((x) => formatLiteral(x as ExprLiteral)).join(', ')}]`;
  if (typeof v === 'string') return `"${v}"`;
  return String(v);
}

/**
 * Render an AST expression node as a human-readable string for UI display only.
 * Not used for execution — evaluation is BE1's responsibility.
 * Wire shape: { type: 'ref' | 'value' | 'op', ... } per engine/schema_models.py.
 */
export function exprToString(node: ExprNode | undefined | null): string {
  if (!node) return '—';

  if ('type' in node && node.type === 'ref') {
    return node.field;
  }
  if ('type' in node && node.type === 'value') {
    return formatLiteral(node.value);
  }
  if ('type' in node && node.type === 'op') {
    const args = node.args ?? [];

    if (node.op === 'always') return 'always';
    if (node.op === 'not') return `!(${exprToString(args[0])})`;
    if (node.op === 'and' || node.op === 'or') {
      const sep = node.op === 'and' ? ' AND ' : ' OR ';
      return `(${args.map(exprToString).join(sep)})`;
    }
    if (node.op === 'round') return `round(${args.map(exprToString).join(', ')})`;
    if (node.op === 'in' || node.op === 'not_in') {
      const verb = node.op === 'in' ? 'in' : 'not in';
      return `${exprToString(args[0])} ${verb} ${exprToString(args[1])}`;
    }

    const sym = BINARY_OPS[node.op];
    if (sym && args.length === 2) {
      return `${exprToString(args[0])} ${sym} ${exprToString(args[1])}`;
    }

    return `${node.op}(${args.map(exprToString).join(', ')})`;
  }

  return '—';
}
