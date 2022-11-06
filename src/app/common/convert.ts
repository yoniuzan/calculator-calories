
import { FoodItem } from "../models/foodItem";
import { FoodItemMongoDb } from "../models/foodItemMongoDb";
import { Ingredients } from "../models/Ingredients";

export class Convert {

    public static GetFoodList(data: any): Array<FoodItem> {
        if (!data)
            return [];

        const foodItems: Array<FoodItem> = [];
        data[0].forEach((item: FoodItem) => {
            const newItem = new FoodItem();
            newItem.fromServer(item);
            foodItems.push(newItem);
        });

        return foodItems;
    }

    public static GetMongoFoodList(data: any): Array<FoodItemMongoDb> {
        if (data.length === 0)
            return [];

        const foodItems: Array<FoodItemMongoDb> = [];
        data.forEach((item: FoodItem) => {
            const newItem = new FoodItemMongoDb();
            newItem.fromServer(item);
            foodItems.push(newItem);
        });

        return foodItems;
    }

    public static GetIngredientsByCode(data: any): Ingredients {
        if (!data)
            return;

        const newItem = new Ingredients();
        newItem.fromServer(data[0].product_info.Nutritional_Values.table.rows);

        return newItem;

    }

    public static GetImageByCode(data: any): string {
        if (!data)
            return;

        return data;

    }


}