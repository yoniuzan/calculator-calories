import { FoodItem } from "./foodItem";

export class SearchProduct {
    public TextInput: string;
    public HaveMoreResult: boolean;
    public FoodItems: Array<FoodItem>;

    /**
     *
     */
    constructor() {
        this.TextInput = '';
        this.HaveMoreResult = true;
        this.FoodItems = [];
    }

    createNewSearchProduct(text: string, haveMoreResult: boolean, foodItems: Array<FoodItem>) : void {
        this.TextInput = text;
        this.HaveMoreResult = haveMoreResult;
        this.FoodItems = foodItems;
    }
}