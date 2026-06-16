import { BaseRepository } from './BaseRepository';
import SeasonalRuleModel, { SeasonalRule } from '../models/seasonal_rule_model';

export class SeasonalRuleRepository extends BaseRepository<SeasonalRule> {
  constructor() {
    super(SeasonalRuleModel);
  }
}
