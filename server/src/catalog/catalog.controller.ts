import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CatalogService } from './catalog.service';
import { BuscarCatalogoDto } from './dto/buscar-catalogo.dto';

@Roles('ORGANIZER')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('buscar')
  buscar(@Query() dto: BuscarCatalogoDto) {
    return this.catalogService.buscarFilmes(dto.q);
  }
}
