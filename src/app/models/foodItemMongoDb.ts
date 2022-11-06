import { FoodItem } from './foodItem';

export class FoodItemMongoDb extends FoodItem {
    // public Id: string;
    public Carbohydrates: number;
    public Description: string;
    public Dessert: number;
    public DietaryFiber: number;
    public Fats: number;
    public Proteins: number;
    public SaturatedFattyAcids: number;
    
    /**
     *
     */
    constructor() {
        super();
        
    }

    public fromServer(other: any): void {
        this.Id = other._id;
        this.Carbohydrates = other.Carbohydrates;
        this.Description = other.Trade_Item_Description;
        this.Dessert = other.Dessert;
        this.DietaryFiber = other.DietaryFiber;
        this.Fats = other.Fats;
        this.Proteins = other.Proteins;
        this.SaturatedFattyAcids = other.SaturatedFattyAcids;
    }

    
}