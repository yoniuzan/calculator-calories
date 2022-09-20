import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Api } from '../common/api';
import { Convert } from '../common/convert';
import { FoodItem } from '../models/foodItem';
import { Ingredients } from '../models/Ingredients';
import { HttpService } from './http.service';

@Injectable({
    providedIn: 'root'
})
export class CalculatorCaloriesService {

    private _foodItemList: Array<FoodItem> = [];
    private _foodTable: Array<Ingredients> = [];

    private _searchItems = {};

    private _foodSearchSubject: Subject<Array<FoodItem>>;
    private _foodTableSubject: Subject<Array<Ingredients>>;

    constructor(private http: HttpService) {
        this._foodSearchSubject = new Subject();
        this._foodTableSubject = new Subject();
    }

    public registerOnsearch(): Observable<Array<FoodItem>> {
        return this._foodSearchSubject.asObservable();
    }

    public registerOnfoodTableChange(): Observable<Array<Ingredients>> {
        return this._foodTableSubject.asObservable();
    }

    public get FoodList(): Array<FoodItem> {
        return this._foodItemList;
    }

    public searchItems(text: string): Promise<void> {
        if (text.length == 0)
            return;

        if (this._searchItems.hasOwnProperty(text)) {
            this._foodItemList = this._searchItems[text];
            this._foodSearchSubject.next(this._searchItems[text]);
            return;
        }

        return this.http.get(Api.Calculator.Search + text, {}, Convert.GetFoodList).then(async (res: Array<FoodItem>) => {
            if (!res)
                return;

            // const promises = [];            
            // res.forEach(async item => {
            //     promises.push(this.http.get(Api.Calculator.getImageByCode + `${item.Code}`, {}, Convert.GetImageByCode).then((res: string) => {
            //         item.Image = res;
            //     }));
            // })

            // Promise.all(promises).then(() => {
            //     this._searchItems[text] = res;
            //     this._foodItemList = res;
            //     this._foodSearchSubject.next(res);
            // });

            this._searchItems[text] = res;
            this._foodItemList = res;
            this._foodSearchSubject.next(res);


        }, (err) => {
            alert('Failed!');
        });
    }

    public getItemIngredients(item: FoodItem): Promise<void> {
        return this.http.get(Api.Calculator.GetByCode + `${item.Code}` + ".json?hq=1", {}, Convert.GetIngredientsByCode).then(async (res: Ingredients) => {
            if (!res)
                return;

            res.Id = item.Id;
            res.Name = item.Description;
            res.Calories = item.Quantity / 100 * res.Calories;

            const calcCarbohydrates = ((item.Quantity / 100 * res.Carbohydrates) - (item.Quantity / 100 * res.DietaryFiber)) / 15;
            res.Dessert = (item.Quantity / 100 * res.Carbohydrates) / 4;
            res.Carbohydrates = calcCarbohydrates < 1 ? 0 : calcCarbohydrates;

            const calcSumFats = res.Fats == 0 ? 0 : item.Quantity / 100 * res.Fats;
            const calcSaturatedFattyAcids = item.Quantity / 100 * res.SaturatedFattyAcids;
            res.Fats = calcSumFats == 0 ? 0 : 15 * (1 - (calcSaturatedFattyAcids / calcSumFats));

            res.Proteins = (item.Quantity / 100 * res.Proteins) / 10;

            this._foodTable.push(res);
            this._foodTableSubject.next(this._foodTable);

        }, (err) => {
            alert("לא קיימים נתונים עבור מוצר זה");
        });
    }

    public removeItem(item: FoodItem) {
        item.IsAdded = false;
        this._foodTable = this._foodTable.filter(el => el.Id != item.Id);
        this._foodTableSubject.next(this._foodTable);
    }

    public clearTable(): void {
        this._foodTable = [];
    }


    // private getImage(code: string): Promise<void> {
    //     return this.http.get(Api.Calculator.getImageByCode + `${code}` + ".json?hq=1", {}, Convert.GetIngredientsByCode).then(async (res: Ingredients) => {
    //         if (!res)
    //             return;

    //         res.Id = item.Id;
    //         res.Name = item.Description;
    //         this._foodTable.push(res);
    //         this._foodTableSubject.next(this._foodTable);

    //     }, (err) => {
    //         alert('Failed!');
    //     });
    // }

}
