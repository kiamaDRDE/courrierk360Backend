// src/correspondant/correspondant.config.ts

import { SearchConfig } from '../common/search.service';

export const correspondantSearchConfig: SearchConfig = {
  stringFields: ['nom', 'email', 'telephone', 'type', 'matricule'],
};
