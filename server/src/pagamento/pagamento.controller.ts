import { Body, Controller, Post } from '@nestjs/common';
import { CriarPagamentoDto } from './dto/criar-pagamento.dto';
import { PagamentoService } from './pagamento.service';

@Controller('pagamentos')
export class PagamentoController {
  constructor(private readonly pagamentoService: PagamentoService) {}

  @Post()
  processar(@Body() dto: CriarPagamentoDto) {
    return this.pagamentoService.processar(dto);
  }
}
