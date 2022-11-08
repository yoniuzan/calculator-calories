import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Api } from '../common/api';
import { Convert } from '../common/convert';
import { FoodItem } from '../models/foodItem';
import { Ingredients } from '../models/Ingredients';
import { HttpService } from './http.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Constants } from '../common/constants';
import { FoodItemMongoDb } from '../models/foodItemMongoDb';

@Injectable({
    providedIn: 'root'
})
export class CalculatorCaloriesService {
    

    private _foodItemList: Array<FoodItem> = [];
    private _foodTable: Array<Ingredients> = [];

    private _searchItems = {};

    private _foodSearchSubject: Subject<Array<FoodItem>>;
    private _foodTableSubject: Subject<Array<Ingredients>>;
    private _removeProductSubject: Subject<string>;
    private _clearTableSubject: Subject<void>;
    private _emptySearchSubject: Subject<void>;

    private startIndex: number;
    private isLoadMore: boolean = false;
    private isEmptyResult: boolean = false;
    private isLassThanMaxProducts: boolean = false;
    private isLassThanMaxProductsContain: boolean = false;
    private isProductContainAndNotEmpty: boolean = false;
    // private isProductContainAndNotEmpty: boolean = false;

    constructor(private http: HttpService, private _sanitizer: DomSanitizer) {
        this._foodSearchSubject = new Subject();
        this._foodTableSubject = new Subject();
        this._removeProductSubject = new Subject();
        this._clearTableSubject = new Subject();
        this._emptySearchSubject = new Subject();
        this.initIndexForMoreItems()

    }

    private initIndexForMoreItems(): void {
        this.startIndex = 0;
    }

    public registerOnsearch(): Observable<Array<FoodItem>> {
        return this._foodSearchSubject.asObservable();
    }

    public registerOnfoodTableChange(): Observable<Array<Ingredients>> {
        return this._foodTableSubject.asObservable();
    }

    public registerOnRemoveProduct(): Observable<string> {
        return this._removeProductSubject.asObservable();
    }

    public registerOnClearTable(): Observable<void> {
        return this._clearTableSubject.asObservable();
    }

    public registerOnEmptySearch(): Observable<void> {
        return this._emptySearchSubject.asObservable();
    }

    public get FoodList(): Array<FoodItem> {
        return this._foodItemList;
    }

    public get IsEmptyResult(): boolean {
        return this.isEmptyResult;
    }

    public set IsLoadMore(isLoadMore: boolean) {
        this.isLoadMore = isLoadMore;
    }

    public searchItems(text: string): Promise<void> {
        if (text.length == 0)
            return;

        // if (this._searchItems.hasOwnProperty(text)) {
        //     this._foodItemList = this._searchItems[text];
        //     this._foodSearchSubject.next(this._searchItems[text]);
        //     return;
        // }

        //////////////////////////////////////
        if (!this.isLoadMore)
            this.initIndexForMoreItems();

        const data = {
            start: this.startIndex
        }

        return this.http.get(Api.Calculator.Search + text, data, Convert.GetFoodList).then(async (res: Array<FoodItem>) => {
            if (!res)
                return;

            this.isEmptyResult = res.length == 0 ? true : false;

            const promises = [];
            res.forEach(async item => {
                promises.push(this.http.getImage(Api.Calculator.getImageByCode + `${item.Code}`, {}, Convert.GetImageByCode).then((res: string) => {
                    item.Image = this._sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,'
                        + res);
                }, (err) => {
                    const imageError = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=="
                    item.Image = this._sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,'
                        + imageError)
                }));
            })

            Promise.all(promises).then(() => {
                if (this.isLoadMore)
                    this._searchItems[text].push(...res);
                else {
                    this._searchItems[text] = res;
                    this._foodItemList = res;
                }

                this._foodSearchSubject.next(this._foodItemList);
                return;
            });

        }, (err) => {
            alert('Failed!');
        });
    }

    public productStart(text: string): Promise<void> {
        if (text.length == 0) {
            this._emptySearchSubject.next();
            return;
        }

        if (!this.isLoadMore) {
            this.isLassThanMaxProducts = false;
            this.initIndexForMoreItems();
        }

        if (this.isLassThanMaxProducts) {
            this.productContain(text);
            return;
        }

        const data = {
            start: this.startIndex
        }

        return this.http.get(Api.Calculator.getProductStart + text, data, Convert.GetFoodList).then(async (res: Array<FoodItem>) => {
            if (!res)
                return;

            this.isEmptyResult = res.length == 0 ? true : false;

            if ((this.isLoadMore && res.length < Constants.Products.productStart) || res.length === 0) {
                this.productContain(text);
                return;
            }


            this.isLassThanMaxProducts = res.length < Constants.Products.productStart;
            if (this.isLassThanMaxProducts)
                this.initIndexForMoreItems();
            this.getProductsImages(res, text);

        }, (err) => {
            alert('Failed!');
        });
    }

    public productContain(text: string): Promise<void> {
        if (text.length == 0) {
            this._emptySearchSubject.next();
            return;
        }

        if (!this.isLoadMore) {
            this.isLassThanMaxProductsContain = false;
            this.initIndexForMoreItems();
        }

        if (this.isLassThanMaxProductsContain) {
            this.productMongo(text);
            return;
        }

        const data = {
            start: this.startIndex
        }

        return this.http.get(Api.Calculator.getProductContain + text, data, Convert.GetFoodList).then(async (res: Array<FoodItem>) => {
            if (!res)
                return;

            this.isEmptyResult = res.length == 0 ? true : false;

            if (res.length == 0) {
                this.initIndexForMoreItems();
                this.productMongo(text);
                return;
            }

            this.isProductContainAndNotEmpty = res.length != 0;

            this.isLassThanMaxProductsContain = res.length < Constants.Products.productStart;
            if (this.isLassThanMaxProductsContain)
                this.initIndexForMoreItems();

            this.getProductsImages(res, text);
        }, (err) => {
            alert('Failed!');
        });
    }

    public productMongo(text: string): Promise<void> {
        if (text.length == 0) {
            this._emptySearchSubject.next();
            return;
        }

        if (!this.isLoadMore || this.isLassThanMaxProductsContain) {
            this.initIndexForMoreItems();
        }
    
        const data = {
            start: this.startIndex
        }

        return this.http.get(Api.Calculator.GetProducMongoDb + text, data, Convert.GetMongoFoodList).then(async (res: Array<FoodItemMongoDb>) => {
            this.isEmptyResult = res.length == 0 || res.length < Constants.Products.productStart ? true : false;
            if (res.length === 0) {
                this._foodSearchSubject.next(this._foodItemList);
                return;
            }

            const imageError = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==";
            res.forEach(x => {
                x.Image = this._sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,'
                    + imageError)
            });

            if (this.isLoadMore)
                this._searchItems[text].push(...res);
            else {
                this._searchItems[text] = res;
                this._foodItemList = res;
            }

            this._foodSearchSubject.next(this._foodItemList);
            return;



        }, (err) => {
            alert('Failed!');
        });
    }

    private getProductsImages(res: Array<FoodItem>, text: string): void {
        const promises = [];
        res.forEach(async item => {
            promises.push(this.http.getImage(Api.Calculator.getImageByCode + `${item.Code}`, {}, Convert.GetImageByCode).then((res: string) => {
                item.Image = this._sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,'
                    + res);
            }, (err) => {
                const imageError = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=="
                item.Image = this._sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,'
                    + imageError)
            }));
        })

        Promise.all(promises).then(() => {
            if (this.isLoadMore)
                this._searchItems[text].push(...res);
            else {
                this._searchItems[text] = res;
                this._foodItemList = res;
            }

            this._foodSearchSubject.next(this._foodItemList);
            return;
        });

    }

    public getItemIngredients(item: FoodItem): Promise<void> {
        return this.http.get(Api.Calculator.GetByCode + `${item.Code}` + ".json?hq=1", {}, Convert.GetIngredientsByCode).then(async (res: Ingredients) => {
            if (!res)
                return;

            res.Id = item.Id;
            res.Name = item.Description;
            res.Calories = item.Quantity / 100 * res.Calories;

            const result = this.calculateIngredients(item.Quantity, res);

            this._foodTable.push(result);
            this._foodTableSubject.next(this._foodTable);

        }, (err) => {
            alert("לא קיימים נתונים עבור מוצר זה");
        });
    }

    public addItemFromMongo(item: FoodItemMongoDb): void {
        const result = this.calculateIngredientsFromMongo(item.Quantity, item);

        this._foodTable.push(result);
        this._foodTableSubject.next(this._foodTable);
    }

    private calculateIngredients(quantity: number, item: Ingredients): Ingredients {

        item.Carbohydrates = ((quantity / 100 * item.Carbohydrates) - (quantity / 100 * item.DietaryFiber)) / 15;
        item.Dessert = (quantity / 100 * item.Dessert) / 4;

        const calcSumFats = item.Fats == 0 ? 0 : quantity / 100 * item.Fats;
        const calcSaturatedFattyAcids = quantity / 100 * item.SaturatedFattyAcids;
        item.Fats = calcSumFats == 0 ? 0 : calcSumFats / (15 * (1 - (calcSaturatedFattyAcids / calcSumFats)));

        item.Proteins = (quantity / 100 * item.Proteins) / 10;

        return item;

    }

    private calculateIngredientsFromMongo(quantity: number, item: FoodItemMongoDb): Ingredients {
        
        const newIngredientsForMongo: Ingredients = new Ingredients();
        newIngredientsForMongo.Id = item.Id;
        newIngredientsForMongo.Name = item.Description;

        newIngredientsForMongo.Carbohydrates = ((quantity / 100 * item.Carbohydrates) - (quantity / 100 * item.DietaryFiber)) / 15;
        newIngredientsForMongo.Dessert = (quantity / 100 * item.Dessert) / 4;

        const calcSumFats = item.Fats == 0 ? 0 : quantity / 100 * item.Fats;
        const calcSaturatedFattyAcids = quantity / 100 * item.SaturatedFattyAcids;
        newIngredientsForMongo.Fats = calcSumFats == 0 ? 0 : calcSumFats / (15 * (1 - (calcSaturatedFattyAcids / calcSumFats)));

        newIngredientsForMongo.Proteins = (quantity / 100 * item.Proteins) / 10;

        return newIngredientsForMongo;

    }

    public removeItem(item: FoodItem) {
        item.IsAdded = false;
        this._removeProductSubject.next(item.Id);
        this._foodTable = this._foodTable.filter(el => el.Id != item.Id);
        this._foodTableSubject.next(this._foodTable);
    }

    public clearTable(): void {
        this._foodTable = [];
        this._clearTableSubject.next();
    }

    public onAddManualyItem(quantity: number, newItem: Ingredients) {
        newItem = this.calculateIngredients(quantity, newItem);
        newItem.Id = Math.floor(Math.random() * 100).toString();
        this._foodTable.push(newItem);
        this._foodTableSubject.next(this._foodTable);
    }

    getMoreItems() {
        if (!this.isLassThanMaxProducts || this.isProductContainAndNotEmpty || this.isLassThanMaxProductsContain)
            this.startIndex += Constants.Products.productStart;
    }

}
