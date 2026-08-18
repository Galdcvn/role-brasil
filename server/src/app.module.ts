import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssentoModule } from './assento/assento.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { EventoModule } from './evento/evento.module';
import { FavoritoModule } from './favorito/favorito.module';
import { IngressoModule } from './ingresso/ingresso.module';
import { MensagemModule } from './mensagem/mensagem.module';
import { PrismaModule } from './prisma/prisma.module';
import { PagamentoModule } from './pagamento/pagamento.module';
import { PortariaModule } from './portaria/portaria.module';
import { ReservaModule } from './reserva/reserva.module';
import { SessaoModule } from './sessao/sessao.module';
import { StatsModule } from './stats/stats.module';
import { UsuarioModule } from './usuario/usuario.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsuarioModule,
    AuthModule,
    CatalogModule,
    EventoModule,
    FavoritoModule,
    IngressoModule,
    MensagemModule,
    AssentoModule,
    ReservaModule,
    PagamentoModule,
    PortariaModule,
    SessaoModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
