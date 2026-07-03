import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly client: MercadoPagoConfig;
  private readonly preference: Preference;
  private readonly payment: Payment;

  constructor(private readonly configService: ConfigService) {
    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN') || '';
    this.client = new MercadoPagoConfig({ accessToken });
    this.preference = new Preference(this.client);
    this.payment = new Payment(this.client);
  }

  /**
   * Crear preferencia de pago (Checkout Pro)
   * Retorna la URL donde el usuario paga
   *
   * NOTA: En sandbox (NODE_ENV !== 'production') NO se envía payer.email
   * para que el campo quede editable en el checkout de Mercado Pago.
   * En producción se pre-llena con el email del cliente.
   */
  async createPreference(params: {
    tramiteId: string;
    clienteNombre: string;
    concepto: string;
    monto: number;
    email: string;
  }) {
    try {
      const response = await this.preference.create({
        body: {
          items: [
            {
              id: params.tramiteId,
              title: params.concepto,
              description: `Pago de derechos - Migración Segura MX`,
              quantity: 1,
              unit_price: params.monto,
              currency_id: 'MXN',
            },
          ],
          payer: {
            name: params.clienteNombre || 'Extranjero',
            // No enviar email al payer para que el campo quede editable en el checkout
            // En producción con pagos reales, el usuario lo escribe manualmente
          },
          payment_methods: {
            excluded_payment_types: [],
            installments: 12,
          },
          back_urls: {
            success: `migracion-segura://pago/exitoso?tramiteId=${params.tramiteId}`,
            failure: `migracion-segura://pago/fallido?tramiteId=${params.tramiteId}`,
            pending: `migracion-segura://pago/pendiente?tramiteId=${params.tramiteId}`,
          },
          auto_return: 'approved',
          external_reference: params.tramiteId,
          notification_url: `https://api.migracionseguramx.com/api/v1/financiero/webhook/mercadopago`,
        },
      });

      this.logger.log(`Preferencia creada: ${response.id} para trámite ${params.tramiteId}`);

      return {
        preferenceId: response.id,
        initPoint: response.init_point,
      };
    } catch (error: any) {
      this.logger.error('Error creando preferencia:', error.message);
      throw error;
    }
  }

  /**
   * Consultar estado de un pago
   */
  async getPayment(paymentId: string) {
    try {
      const response = await this.payment.get({ id: paymentId });
      return {
        id: response.id,
        status: response.status, // approved, pending, rejected
        statusDetail: response.status_detail,
        amount: response.transaction_amount,
        externalReference: response.external_reference,
        paymentMethod: response.payment_method_id,
        dateApproved: response.date_approved,
      };
    } catch (error: any) {
      this.logger.error('Error consultando pago:', error.message);
      throw error;
    }
  }
}
