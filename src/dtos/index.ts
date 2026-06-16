export interface GardenDto {
  id: string;
  name: string;
  type: string;
  score: number;
}

export interface ZoneDto {
  id: string;
  gardenId: string;
  name: string;
  type: string;
}

export interface PlantDto {
  id: string;
  zoneId: string;
  name: string;
  imageUrl: string;
  stage: string;
  healthScore: number;
}
