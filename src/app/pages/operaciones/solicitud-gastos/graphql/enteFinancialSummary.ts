import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { getEnteFinancialSummaryQuery } from './getEnteFinancialSummary';
import { EnteFinancialSummaryResponse } from '../utils/ente-financial-summary.util';

export interface EnteFinancialSummaryQueryResponse {
  data: EnteFinancialSummaryResponse;
}

@Injectable({
  providedIn: 'root',
})
export class EnteFinancialSummaryGQL extends Query<
  EnteFinancialSummaryQueryResponse,
  { enteId: number; tipoGastoId?: number | null }
> {
  document = getEnteFinancialSummaryQuery;
}
