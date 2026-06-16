import PlantDnaModel, { PlantDna } from '../models/plant_dna_model';
import { BaseRepository } from './BaseRepository';

export class DnaRepository extends BaseRepository<PlantDna> {
  constructor() {
    super(PlantDnaModel);
  }

  async findBySpecies(species: string): Promise<PlantDna | null> {
    return this.model.findOne({ species }).exec();
  }
}
