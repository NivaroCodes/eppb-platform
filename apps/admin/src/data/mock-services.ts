import type { FormRecord, ServiceSchema } from '@/types/schema';

/** Mirrors seed_data/leasing_stage1.json (v2.0 AST). */
const leasingStage1Schema: ServiceSchema = {
  serviceCode: 'leasing-aviation-wagons-stage1',
  version: '2.0.0',
  title: 'Приобретение авиатранспорта и вагонов в лизинг — I этап',
  description: 'Первая ступень заявки на лизинг авиатранспорта и вагонов',
  config: {
    allow_drafts: true,
    auto_save: true,
    integration_required: ['egov_mock'],
  },
  steps: [
    {
      id: 'step_1_company',
      title: 'Сведения о компании',
      description: 'Идентификация и форма собственности',
      fields: [
        {
          id: 'bin',
          type: 'string',
          label: 'БИН компании',
          validation: {
            required: true,
            pattern: '^\\d{12}$',
          },
          autofill: { source: 'egov_mock' },
        },
        {
          id: 'company_name',
          type: 'string',
          label: 'Наименование',
          readonly: true,
          disabled: true,
        },
        {
          id: 'ownership_type',
          type: 'select',
          label: 'Форма собственности',
          validation: { required: true },
          options: ['ТОО', 'АО', 'ИП'],
        },
      ],
      transitions: [
        {
          to: 'step_2_leasing',
          condition: { type: 'op', op: 'always', args: [] },
        },
      ],
    },
    {
      id: 'step_2_leasing',
      title: 'Параметры лизинга',
      fields: [
        {
          id: 'wagon_count',
          type: 'number',
          label: 'Количество вагонов',
          validation: { required: true, min: 1, max: 10000 },
        },
        {
          id: 'wagon_price',
          type: 'number',
          label: 'Цена за единицу, ₸',
          validation: { required: true, min: 0 },
        },
        {
          id: 'total_cost',
          type: 'calculated',
          label: 'Общая стоимость, ₸',
          readonly: true,
          deps: ['wagon_count', 'wagon_price'],
          formula: {
            type: 'op',
            op: 'multiply',
            args: [
              { type: 'ref', field: 'wagon_count' },
              { type: 'ref', field: 'wagon_price' },
            ],
          },
        },
        {
          id: 'leasing_term',
          type: 'select',
          label: 'Срок лизинга',
          validation: { required: true },
          options: ['12 мес.', '24 мес.', '36 мес.', '60 мес.'],
        },
      ],
      transitions: [
        {
          to: 'step_3_documents_gate',
          condition: { type: 'op', op: 'always', args: [] },
        },
      ],
    },
    {
      id: 'step_3_documents_gate',
      title: 'Документы — маршрутизация',
      description: 'Выбор набора документов по форме собственности',
      fields: [],
      transitions: [
        {
          to: 'step_documents_lite',
          condition: {
            type: 'op',
            op: 'eq',
            args: [
              { type: 'ref', field: 'ownership_type' },
              { type: 'value', value: 'ИП' },
            ],
          },
        },
        {
          to: 'step_documents_full',
          condition: { type: 'op', op: 'always', args: [] },
        },
      ],
    },
    {
      id: 'step_documents_lite',
      title: 'Загрузка документов (упрощённый комплект)',
      fields: [
        {
          id: 'id_document',
          type: 'file',
          label: 'Удостоверение личности',
          validation: { required: true },
        },
        {
          id: 'lease_application_scan',
          type: 'file',
          label: 'Скан заявления',
          validation: { required: true },
        },
      ],
      transitions: [
        {
          to: 'step_complete',
          condition: { type: 'op', op: 'always', args: [] },
        },
      ],
    },
    {
      id: 'step_documents_full',
      title: 'Загрузка документов (полный комплект)',
      fields: [
        {
          id: 'financial_report',
          type: 'file',
          label: 'Финансовая отчётность',
          validation: { required: true },
        },
        {
          id: 'charter_scan',
          type: 'file',
          label: 'Устав / учредительные документы',
          validation: { required: true },
        },
        {
          id: 'lease_application_scan_full',
          type: 'file',
          label: 'Скан заявления',
          validation: { required: true },
        },
      ],
      transitions: [
        {
          to: 'step_complete',
          condition: { type: 'op', op: 'always', args: [] },
        },
      ],
    },
    {
      id: 'step_complete',
      title: 'Заявка сформирована',
      description: 'Терминальный шаг этапа I',
      fields: [],
      transitions: [],
    },
  ],
};

/** Second demo service — seed_data/leasing_stage2.json shape (v2.0 AST). */
const leasingStage2Schema: ServiceSchema = {
  serviceCode: 'leasing-aviation-wagons-stage2',
  version: '2.0.0',
  title: 'Приобретение авиатранспорта и вагонов в лизинг — II этап',
  description: 'Вторая ступень заявки (продолжение после этапа I)',
  config: {
    allow_drafts: true,
    integration_required: ['egov_mock'],
  },
  steps: [
    {
      id: 'step_1_link',
      title: 'Связь с этапом I',
      fields: [
        {
          id: 'stage1_application_id',
          type: 'string',
          label: 'Номер заявки этапа I',
          validation: { required: true, pattern: '^[A-Z0-9\\-]{6,64}$' },
        },
        {
          id: 'bin',
          type: 'string',
          label: 'БИН компании',
          validation: { required: true, pattern: '^\\d{12}$' },
          autofill: { source: 'egov_mock' },
        },
        {
          id: 'company_name',
          type: 'string',
          label: 'Наименование',
          readonly: true,
          disabled: true,
        },
        {
          id: 'ownership_type',
          type: 'select',
          label: 'Форма собственности',
          validation: { required: true },
          options: ['ТОО', 'АО', 'ИП'],
        },
      ],
      transitions: [
        {
          to: 'step_2_terms',
          condition: { type: 'op', op: 'always', args: [] },
        },
      ],
    },
    {
      id: 'step_2_terms',
      title: 'Условия этапа II',
      fields: [
        {
          id: 'asset_units',
          type: 'number',
          label: 'Количество единиц актива',
          validation: { required: true, min: 1 },
        },
        {
          id: 'unit_price',
          type: 'number',
          label: 'Стоимость единицы, ₸',
          validation: { required: true, min: 0 },
        },
        {
          id: 'stage2_total',
          type: 'calculated',
          label: 'Итого по этапу II, ₸',
          readonly: true,
          deps: ['asset_units', 'unit_price'],
          formula: {
            type: 'op',
            op: 'multiply',
            args: [
              { type: 'ref', field: 'asset_units' },
              { type: 'ref', field: 'unit_price' },
            ],
          },
        },
        {
          id: 'review_term',
          type: 'select',
          label: 'Срок рассмотрения',
          validation: { required: true },
          options: ['15 р.д.', '30 р.д.'],
        },
      ],
      transitions: [
        {
          to: 'step_3_docs_branch',
          condition: { type: 'op', op: 'always', args: [] },
        },
      ],
    },
    {
      id: 'step_3_docs_branch',
      title: 'Документы — маршрутизация',
      fields: [],
      transitions: [
        {
          to: 'step_docs_lite_2',
          condition: {
            type: 'op',
            op: 'eq',
            args: [
              { type: 'ref', field: 'ownership_type' },
              { type: 'value', value: 'ИП' },
            ],
          },
        },
        {
          to: 'step_docs_full_2',
          condition: { type: 'op', op: 'always', args: [] },
        },
      ],
    },
    {
      id: 'step_docs_lite_2',
      title: 'Документы (ИП)',
      fields: [
        {
          id: 'statement_ip',
          type: 'file',
          label: 'Заявление ИП',
          validation: { required: true },
        },
      ],
      transitions: [
        {
          to: 'step_complete_2',
          condition: { type: 'op', op: 'always', args: [] },
        },
      ],
    },
    {
      id: 'step_docs_full_2',
      title: 'Документы (юрлицо)',
      fields: [
        {
          id: 'financials_stage2',
          type: 'file',
          label: 'Финансовая отчётность',
          validation: { required: true },
        },
        {
          id: 'board_minutes',
          type: 'file',
          label: 'Протокол органа управления',
          validation: { required: true },
        },
      ],
      transitions: [
        {
          to: 'step_complete_2',
          condition: { type: 'op', op: 'always', args: [] },
        },
      ],
    },
    {
      id: 'step_complete_2',
      title: 'Этап II завершён',
      fields: [],
      transitions: [],
    },
  ],
};

export const mockForms: FormRecord[] = [
  {
    id: '1',
    name: leasingStage1Schema.title,
    schema_version: '2.0.0',
    is_published: true,
    schema: leasingStage1Schema,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-04-20T14:30:00Z',
  },
  {
    id: '2',
    name: leasingStage2Schema.title,
    schema_version: '2.0.0',
    is_published: false,
    schema: leasingStage2Schema,
    created_at: '2025-03-01T09:00:00Z',
    updated_at: '2025-04-25T11:00:00Z',
  },
];
