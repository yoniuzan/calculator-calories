export class FoodItem {
    public Id: string;
    public Code: string;
    public Description: string;
    public Quantity: number;
    public IsAdded: boolean;
    public Image: any;

    /**
     *
     */
    constructor() {
        this.Quantity = 0;
        this.IsAdded = false;
        this.Image = '';
    }

    public fromServer(other: any): void {
        this.Id = other.id;
        this.Code = other.product_code;
        this.Description = other.Trade_Item_Description;
    }
}