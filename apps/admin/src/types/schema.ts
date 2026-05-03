// ===== JSON CONTRACT v2.0 (AST-based execution model) =====
//
// Invariants (agreed with BE1/BE2/FE2):
//   1. All conditions and formulas are AST nodes. No string DSL anywhere.
//   2. ServiceSchema is stored in DB as root-level `serviceCode`/`version`/`steps`,
//      NOT wrapped under `content`.
//   3. engine/ is a separate package; FE1 never imports it.
//   4. Runtime returns AdvanceResult = { next_step_id, errors, calculated, is_final }.
//   5. A step is final when it has no transitions, or all its transitions target
//      a step_id that does not exist.

export const CONTRACT_VERSION = '2.0' as const;

// --- AST expression nodes (wire format matches engine/schema_models.py) ---

export type ExprOp =
  // arithmetic
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'round'
  // logical
  | 'and'
  | 'or'
  | 'not'
  // comparison
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'not_in'
  // control
  | 'always';

export type ExprLiteral =
  | string
  | number
  | boolean
  | null
  | Array<string | number | boolean | null>;

export interface ExprNodeOp {
  type: 'op';
  op: ExprOp;
  args?: ExprNode[];
}

export interface ExprNodeRef {
  type: 'ref';
  field: string;
}

export interface ExprNodeValue {
  type: 'value';
  value: ExprLiteral;
}

export type ExprNode = ExprNodeOp | ExprNodeRef | ExprNodeValue;

// --- Form primitives ---

export type FieldType = 'string' | 'number' | 'select' | 'file' | 'calculated';

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  allowedFormats?: string[];
  maxSizeMB?: number;
}

export interface FieldUI {
  placeholder?: string;
  helpText?: string;
}

export interface AutofillConfig {
  source: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  required?: boolean;
  defaultValue?: string | number | boolean | null;
  ui?: FieldUI;
  validation?: FieldValidation;
  options?: string[];
  formula?: ExprNode;
  deps?: string[];
  readonly?: boolean;
  disabled?: boolean;
  autofill?: AutofillConfig;
}

export interface Transition {
  to: string;
  condition: ExprNode;
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  transitions: Transition[];
}

export interface ServiceConfig {
  allow_drafts?: boolean;
  auto_save?: boolean;
  integration_required?: string[];
}

export interface ServiceSchema {
  serviceCode: string;
  version: string;
  title: string;
  description: string;
  config: ServiceConfig;
  steps: FormStep[];
}

// ===== Backend API types =====

export interface FormRecord {
  id: string;
  name: string;
  description?: string;
  schema: ServiceSchema;
  schema_version: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AdvanceResult {
  next_step_id: string | null;
  errors: Record<string, string>;
  calculated: Record<string, unknown>;
  is_final: boolean;
}

export interface SubmitResult {
  submission_id: string;
  ref_id: string;
  status: string;
}
