
export interface ErrorResponse {
  code: string;
  message: string;
}

export interface UIViewModel {
  ui_version: string;
  header: {
    title: string;
    subtitle: string;
    timestamp_label: string;
    quality_badges: { label: string; severity: 'good' | 'warn' | 'bad' }[];
  };
  kpi_cards: {
    id: string;
    title: string;
    value_label: string;
    value_level: number;
    severity: 'good' | 'warn' | 'bad';
    hint: string;
  }[];
  charts: {
    id: string;
    type: 'line';
    title: string;
    x: { type: 'category'; label: string; values: string[] };
    y: { type: 'number'; label: string; min: number; max: number };
    series: { name: string; values: number[]; tooltip_format?: string }[];
    annotations?: { type: 'note'; text: string }[];
  }[];
  tables: {
    id: string;
    title: string;
    columns: { key: string; label: string }[];
    rows: any[];
    notes?: string[];
    group_by?: string;
    default_collapsed_categories?: string[];
  }[];
  summaries: {
    today_one_liner: string;
    next_days_one_liner: string;
    midterm_one_liner: string;
  };
  recommendation_blocks: {
    id: string;
    title: string;
    items: { title: string; detail: string; priority: 'hoch' | 'mittel' | 'niedrig' }[];
  }[];
  footnotes: string[];
  error?: ErrorResponse;
}
