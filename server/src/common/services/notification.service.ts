export interface NotificationService {
  enviarConfirmacaoCompra(dados: {
    nome: string;
    email: string;
    evento: string;
    codigo: string;
  }): void;

  enviarCancelamento(dados: {
    nome: string;
    email: string;
    evento: string;
    codigo: string;
  }): void;

  enviarMensagem(dados: {
    nomeDestinatario: string;
    emailDestinatario: string;
    evento: string;
    remetente: string;
  }): void;
}

export class ConsoleNotificationService implements NotificationService {
  enviarConfirmacaoCompra(dados: {
    nome: string;
    email: string;
    evento: string;
    codigo: string;
  }) {
    console.log(
      `[EMAIL] Confirmação de compra para ${dados.email}: Ingresso ${dados.codigo} confirmado para "${dados.evento}"`,
    );
  }

  enviarCancelamento(dados: {
    nome: string;
    email: string;
    evento: string;
    codigo: string;
  }) {
    console.log(
      `[EMAIL] Cancelamento para ${dados.email}: Ingresso ${dados.codigo} cancelado para "${dados.evento}"`,
    );
  }

  enviarMensagem(dados: {
    nomeDestinatario: string;
    emailDestinatario: string;
    evento: string;
    remetente: string;
  }) {
    console.log(
      `[EMAIL] Nova mensagem de ${dados.remetente} para ${dados.emailDestinatario} sobre "${dados.evento}"`,
    );
  }
}
