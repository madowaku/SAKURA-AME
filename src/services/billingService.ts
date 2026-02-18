export interface BillingProduct {
    itemId: string;
    purchaseOptionId: string;
}

class BillingService {
    private service: any = null;
    private readonly ITEM_ID = 'sakuraame_premium_unlock';
    private readonly PURCHASE_OPTION_ID = 'sakuraame-premium-unlock';

    async init(): Promise<boolean> {
        if ('getDigitalGoodsService' in window) {
            try {
                // @ts-ignore
                this.service = await window.getDigitalGoodsService('https://play.google.com/billing');
                return true;
            } catch (e) {
                console.warn('Digital Goods API is not supported or failed to initialize', e);
                return false;
            }
        }
        return !!window.PaymentRequest;
    }

    async checkPurchaseHistory(): Promise<boolean> {
        if (!this.service) return false;
        try {
            const details = await this.service.listPurchases();
            return details.some((purchase: any) => purchase.itemId === this.ITEM_ID);
        } catch (e) {
            console.error('Failed to check purchase history', e);
            return false;
        }
    }

    async requestPurchase(): Promise<'success' | 'canceled' | 'failed'> {
        if (!window.PaymentRequest) {
            console.error('Payment Request API is not supported');
            return 'failed';
        }

    // Payment UI の状態を追跡するための変数
    let response: any = null;

    // すでに所有しているか事前チェック（所有済みならここで即終了）
        if (this.service) {
            const existing = await this.service.listPurchases();
            const alreadyOwned = existing.some((p: any) => p.itemId === this.ITEM_ID);
            if (alreadyOwned) {
                return 'success';
            }
        }

        const paymentMethods = [{
            supportedMethods: 'https://play.google.com/billing',
            data: {
                sku: this.ITEM_ID, // 実際にはDigital Goods APIと連携する場合、skuやitemIdを指定
            }
        }];

        const details = {
            total: {
                label: 'Total',
                amount: { currency: 'JPY', value: '0' } // Digital Goods APIでは通常、ストア側の価格が優先されるが、型定義上必要
            }
        };

        try {
            const request = new PaymentRequest(paymentMethods, details);
      response = await request.show();

      // ─────────────────────────────────────
      // 1. Digital Goods API での確認・承認
      // ─────────────────────────────────────
            if (this.service) {
        try {
          // 購入情報の詳細を取得して承認
          const purchases = await this.service.listPurchases();
          const latestPurchase = purchases.find((p: any) => p.itemId === this.ITEM_ID);

          if (latestPurchase) {
            // 購入済みであれば承認する（消費型アイテムでない場合は一度だけでOK）
            // @ts-ignore
            await this.service.acknowledge(latestPurchase.purchaseToken, 'onetime');
          }
        } catch (dgError) {
          console.warn('Digital Goods post-processing failed', dgError);
          // ここで例外を投げ直さず、UI は閉じて「ひとまず成功」とみなす
        }
            }

      // ─────────────────────────────────────
      // 2. Payment UI を確実に閉じる
      // ─────────────────────────────────────
      if (response && typeof response.complete === 'function') {
        try {
          await response.complete('success');
        } catch (completeError) {
          console.warn('Payment response complete failed', completeError);
        }
      }

            return 'success';

        } catch (e: any) {
      // ここに来るのはユーザーキャンセルや通信エラーなど

      // すでに Payment UI が開いていて、まだ complete していない場合は閉じる
      if (response && typeof response.complete === 'function') {
        try {
          await response.complete('fail');
        } catch {
          // ここでのエラーは無視（すでに閉じているなど）
        }
      }

      // 👇 所有済みでも例外経路に来ることがあるので、改めて確認
            if (this.service) {
                const existing = await this.service.listPurchases();
                const alreadyOwned = existing.some((p: any) => p.itemId === this.ITEM_ID);
                if (alreadyOwned) {
                    return 'success';
                }
            }

            if (e.name === 'AbortError') {
                return 'canceled';
            }
            console.error('Purchase failed', e);
            return 'failed';
        }
    }
}

export const billingService = new BillingService();
