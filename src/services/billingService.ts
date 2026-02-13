export interface BillingProduct {
    itemId: string;
    purchaseOptionId: string;
}

class BillingService {
    private service: any = null;
    private readonly ITEM_ID = 'sakuraame_premium_unlock';
    private readonly PURCHASE_OPTION_ID = 'sakuraame-premium-unlock';

    async init() {
        if ('getDigitalGoodsService' in window) {
            try {
                // @ts-ignore
                this.service = await window.getDigitalGoodsService('https://play.google.com/billing');
            } catch (e) {
                console.warn('Digital Goods API is not supported or failed to initialize', e);
            }
        }
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
            const response = await request.show();

            // 購入処理の完了を待機し、Digital Goods API で確認・承認（acknowledge）を行う
            // TWAでは推奨されるフロー
            if (this.service) {
                // 購入情報の詳細を取得して承認
                const purchases = await this.service.listPurchases();
                const latestPurchase = purchases.find((p: any) => p.itemId === this.ITEM_ID);

                if (latestPurchase) {
                    // 購入済みであれば承認する（消費型アイテムでない場合は一度だけでOK）
                    // @ts-ignore
                    await this.service.acknowledge(latestPurchase.purchaseToken, 'onetime');
                    await response.complete('success');
                    return 'success';
                }
            }

            // Digital Goods Serviceがない場合や最新の購入が見つからない場合でも、
            // PaymentResponseが成功していれば一旦成功とみなす（デバッグ用）
            await response.complete('success');
            return 'success';

        } catch (e: any) {
            if (e.name === 'AbortError') {
                return 'canceled';
            }
            console.error('Purchase failed', e);
            return 'failed';
        }
    }
}

export const billingService = new BillingService();
