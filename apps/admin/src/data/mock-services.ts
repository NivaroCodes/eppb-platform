import type { FormRecord } from '@/types/schema';

export const mockForms: FormRecord[] = [
  {
    id: '1',
    name: 'Лизинг транспортных активов',
    schema_version: '1.0.0',
    is_published: true,
    schema: {
      serviceCode: 'leasing-transport',
      version: '1.0.0',
      title: 'Лизинг транспортных активов',
      description: 'Программа лизинга транспортных средств для субъектов МСБ',
      config: {
        allowDrafts: true,
        autoSave: true,
        integrationRequired: ['egov-company-info'],
      },
      steps: [
        {
          id: 'step_1',
          title: 'Идентификация',
          description: 'Данные заявителя',
          fields: [
            {
              id: 'iin',
              type: 'string',
              label: 'ИИН',
              required: true,
              ui: { placeholder: 'Введите 12-значный ИИН' },
              validation: { pattern: '^\\d{12}$' },
            },
            {
              id: 'company_name',
              type: 'string',
              label: 'Наименование организации',
              required: true,
              validation: { minLength: 3, maxLength: 255 },
            },
            {
              id: 'asset_type',
              type: 'select',
              label: 'Тип актива',
              required: true,
              options: [
                { label: 'Грузовик', value: 'truck' },
                { label: 'Автобус', value: 'bus' },
                { label: 'Спецтехника', value: 'special' },
              ],
            },
          ],
          transitions: [
            { to: 'step_2', condition: { op: 'always' } },
          ],
        },
        {
          id: 'step_2',
          title: 'Финансовые данные',
          description: 'Параметры лизинга',
          fields: [
            {
              id: 'cost',
              type: 'number',
              label: 'Стоимость актива (KZT)',
              required: true,
              validation: { min: 0 },
            },
            {
              id: 'vat_amount',
              type: 'calculated',
              label: 'НДС (12%)',
              formula: {
                op: 'multiply',
                args: [{ ref: 'cost' }, { value: 0.12 }],
              },
              deps: ['cost'],
              readonly: true,
            },
          ],
          transitions: [
            {
              to: 'step_3_docs',
              condition: {
                op: 'lte',
                args: [{ ref: 'cost' }, { value: 50000000 }],
              },
            },
            {
              to: 'step_3_audit',
              condition: {
                op: 'gt',
                args: [{ ref: 'cost' }, { value: 50000000 }],
              },
            },
          ],
        },
        {
          id: 'step_3_docs',
          title: 'Загрузка документов',
          description: 'Стандартный пакет документов',
          fields: [
            {
              id: 'contract_file',
              type: 'file',
              label: 'Договор',
              required: true,
              validation: { allowedFormats: ['pdf', 'png'], maxSizeMB: 10 },
            },
            {
              id: 'registration_doc',
              type: 'file',
              label: 'Свидетельство о регистрации',
              required: true,
              validation: { allowedFormats: ['pdf'], maxSizeMB: 10 },
            },
          ],
          transitions: [],
        },
        {
          id: 'step_3_audit',
          title: 'Финансовый аудит',
          description: 'Требуется для активов свыше 50 млн KZT',
          fields: [
            {
              id: 'audit_report',
              type: 'file',
              label: 'Аудиторский отчёт',
              required: true,
              validation: { allowedFormats: ['pdf'], maxSizeMB: 20 },
            },
            {
              id: 'credit_justification',
              type: 'string',
              label: 'Обоснование кредита',
              required: true,
              validation: { minLength: 50 },
              ui: { helpText: 'Опишите цель и обоснование привлечения лизинга' },
            },
          ],
          transitions: [],
        },
      ],
    },
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-04-20T14:30:00Z',
  },
  {
    id: '2',
    name: 'Гарантирование займов',
    schema_version: '1.0.0',
    is_published: false,
    schema: {
      serviceCode: 'guarantee-loans',
      version: '1.0.0',
      title: 'Гарантирование займов',
      description: 'Предоставление гарантий по кредитам субъектов МСБ',
      config: { allowDrafts: true, autoSave: false },
      steps: [
        {
          id: 'step_1',
          title: 'Данные заявителя',
          fields: [
            {
              id: 'iin',
              type: 'string',
              label: 'ИИН',
              required: true,
              validation: { pattern: '^\\d{12}$' },
            },
            {
              id: 'company_name',
              type: 'string',
              label: 'Наименование',
              required: true,
            },
          ],
          transitions: [],
        },
      ],
    },
    created_at: '2025-03-01T09:00:00Z',
    updated_at: '2025-04-25T11:00:00Z',
  },
];
