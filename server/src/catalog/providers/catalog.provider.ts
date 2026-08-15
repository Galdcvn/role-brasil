export interface CatalogItem {
  id: number;
  titulo: string;
  descricao: string;
  posterUrl: string;
  ano: number;
}

export interface CatalogProvider {
  search(query: string): Promise<CatalogItem[]>;
  getById(id: number): Promise<CatalogItem | null>;
}
