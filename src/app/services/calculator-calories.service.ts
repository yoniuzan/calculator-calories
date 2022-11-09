import { Injectable } from '@angular/core';
import { Observable, Subject, forkJoin } from 'rxjs';
import { Api } from '../common/api';
import { Convert } from '../common/convert';
import { FoodItem } from '../models/foodItem';
import { Ingredients } from '../models/Ingredients';
import { HttpService } from './http.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Constants } from '../common/constants';
import { FoodItemMongoDb } from '../models/foodItemMongoDb';
import { Enums } from '../common/enum';
import { SearchProduct } from '../models/searchProduct';

@Injectable({
    providedIn: 'root'
})
export class CalculatorCaloriesService {

    private _foodItemList: Array<FoodItem> = [];
    private _foodTable: Array<Ingredients> = [];

    // private _searchItems: {[index:Array<FoodItem>] = {};
    private _searchProducts: Array<SearchProduct> = [];

    private _foodSearchSubject: Subject<Array<FoodItem>>;
    private _foodTableSubject: Subject<Array<Ingredients>>;
    private _removeProductSubject: Subject<string>;
    private _clearTableSubject: Subject<void>;
    private _emptySearchSubject: Subject<void>; // אין עוד תוצאות עבור מוצר ספציפי
    private _noResult: Subject<void>; // אין מוצרים בכלל

    private startIndex: number;
    private isLoadMore: boolean = false;
    private isEmptyResult: boolean = false;

    private nextRequest: Enums.StateRequest = Enums.StateRequest.Start;
    private prevRequest: Enums.StateRequest = Enums.StateRequest.Start;

    constructor(private http: HttpService, private _sanitizer: DomSanitizer) {
        this._foodSearchSubject = new Subject();
        this._foodTableSubject = new Subject();
        this._removeProductSubject = new Subject();
        this._clearTableSubject = new Subject();
        this._emptySearchSubject = new Subject();
        this._noResult = new Subject();
        this.startIndex = 0;

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

    public registerOnNoResult(): Observable<void> {
        return this._noResult.asObservable();
    }

    public get FoodList(): Array<FoodItem> {
        return this._foodItemList;
    }

    public get IsEmptyResult(): boolean {
        return this.isEmptyResult;
    }

    public get productAlreadySearch(): Array<SearchProduct> {
        return this._searchProducts;
    }

    public set IsLoadMore(isLoadMore: boolean) {
        this.isLoadMore = isLoadMore;
    }

    // public searchItems(text: string): Promise<void> {
    //     if (text.length == 0)
    //         return;

    //     if (!this.isLoadMore)
    //         this.initIndexForMoreItems();

    //     const data = {
    //         start: this.startIndex
    //     }

    //     return this.http.get(Api.Calculator.Search + text, data, Convert.GetFoodList).then(async (res: Array<FoodItem>) => {
    //         if (!res)
    //             return;

    //         this.isEmptyResult = res.length == 0 ? true : false;

    //         const promises = [];
    //         res.forEach(async item => {
    //             promises.push(this.http.getImage(Api.Calculator.getImageByCode + `${item.Code}`, {}, Convert.GetImageByCode).then((res: string) => {
    //                 item.Image = this._sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,'
    //                     + res);
    //             }, (err) => {
    //                 const imageError = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=="
    //                 item.Image = this._sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,'
    //                     + imageError)
    //             }));
    //         })

    //         Promise.all(promises).then(() => {
    //             if (this.isLoadMore)
    //                 this._searchItems[text].push(...res);
    //             else {
    //                 this._searchItems[text] = res;
    //                 this._foodItemList = res;
    //             }

    //             this._foodSearchSubject.next(this._foodItemList);
    //             return;
    //         });

    //     }, (err) => {
    //         alert('Failed!');
    //     });
    // }


    public getProductsByInput(text: string): Promise<void> {

        if (text.length == 0) {
            this._emptySearchSubject.next();
            return;
        }

        const productWrapper: SearchProduct = this._searchProducts.find(t => t.TextInput === text);

        // means that is new input
        if (!productWrapper) {
            this.nextRequest = Enums.StateRequest.Start;
            this.prevRequest = Enums.StateRequest.Start;
        }

        // means that input alredy search => cache!!!
        if (productWrapper && !this.isLoadMore) {
            this.isEmptyResult = false;
            this._foodItemList = productWrapper.FoodItems;
            this._foodSearchSubject.next(productWrapper.FoodItems);
            return;
        }

        switch (this.nextRequest) {
            case Enums.StateRequest.Start:
                return this.productStart(text);

            case Enums.StateRequest.Contain:
                return this.productContain(text);

            case Enums.StateRequest.Mongo:
                return this.productMongo(text);

            default:
                return this.productStart(text);
        }
    }

    private productStart(text: string): Promise<void> {
        if (!this.isLoadMore)
            this.initIndexForMoreItems();

        const data = {
            start: this.startIndex
        }

        return this.http.get(Api.Calculator.getProductStart + text, data, Convert.GetFoodList).then(async (res: Array<FoodItem>) => {
            if (!res)
                return;

            this.isEmptyResult = res.length == 0 ? true : false;


            if ((this.isLoadMore && res.length < Constants.Products.productStart) || res.length === 0) {
                this.prevRequest = Enums.StateRequest.Start;
                this.nextRequest = Enums.StateRequest.Contain;
                this.productContain(text);
                return;
            }

            if (res.length < Constants.Products.productStart) {
                this.prevRequest = Enums.StateRequest.Start;
                this.nextRequest = Enums.StateRequest.Contain;
                this.initIndexForMoreItems();
            }

            if (res.length === Constants.Products.productStart)
                this.prevRequest = Enums.StateRequest.Start;

            this.getProductsImages(res, text);

        }, (err) => {
            alert('Failed!');
        });
    }

    private productContain(text: string): Promise<void> {
        if (!this.isLoadMore) {
            this.initIndexForMoreItems();
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


            if (res.length < Constants.Products.productStart) {
                this.prevRequest = Enums.StateRequest.Contain;
                this.nextRequest = Enums.StateRequest.Mongo;
                this.initIndexForMoreItems();
            }

            if (res.length === Constants.Products.productStart)
                this.prevRequest = Enums.StateRequest.Contain;

            this.getProductsImages(res, text);
        }, (err) => {
            alert('Failed!');
        });
    }

    private productMongo(text: string): Promise<void> {
        if (!this.isLoadMore) {
            this.initIndexForMoreItems();
        }

        const data = {
            start: this.startIndex
        }

        return this.http.get(Api.Calculator.GetProducMongoDb + text, data, Convert.GetMongoFoodList).then(async (res: Array<FoodItemMongoDb>) => {

            this.isEmptyResult = res.length == 0 || res.length < Constants.Products.productStart ? true : false;
            const prod = this._searchProducts.find(t => t.TextInput === text);

            if (res.length === 0) {
                if (prod) {
                    prod.HaveMoreResult = res.length >= Constants.Products.productStart;
                    this._foodSearchSubject.next(this._foodItemList)
                }

                else
                    this._noResult.next();
                return;
            }

            if (res.length === Constants.Products.productStart)
                this.prevRequest = Enums.StateRequest.Mongo;

            if (prod)
                prod.HaveMoreResult = res.length >= Constants.Products.productStart;

            const imageError = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==";
            res.forEach(x => {
                x.Image = this._sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,'
                    + imageError)
            });

            if (this.isLoadMore) {
                const newSearchProduct: SearchProduct = this._searchProducts.find(t => t.TextInput === text);
                newSearchProduct.FoodItems.push(...res);
            }

            else {
                const newSearchProduct: SearchProduct = new SearchProduct();
                newSearchProduct.createNewSearchProduct(text, true, res);
                this._searchProducts.push(newSearchProduct);
                this._foodItemList = res;
            }

            this._foodSearchSubject.next(this._foodItemList);
            return;

        }, (err) => {
            alert('Failed!');
        });
    }

    private getProductsImages(res: Array<FoodItem>, text: string): void {
        const productImages = [];
        res.forEach(async item => {
            productImages.push(this.http.getImage(Api.Calculator.getImageByCode + `${item.Code}`, {}, Convert.GetImageByCode).then((res: string) => {
                item.Image = this._sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,'
                    + res);
            }, (err) => {
                const imageError = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=="
                item.Image = this._sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,'
                    + imageError)
            }));
        })

        forkJoin(productImages).subscribe(() => {
            if (this.isLoadMore) {
                const newSearchProduct: SearchProduct = this._searchProducts.find(t => t.TextInput === text);
                newSearchProduct.FoodItems.push(...res);
            }
            else {
                const newSearchProduct: SearchProduct = new SearchProduct();
                newSearchProduct.createNewSearchProduct(text, true, res);
                this._searchProducts.push(newSearchProduct);
                this._foodItemList = res;
            }

            this._foodSearchSubject.next(this._foodItemList);
            return;
        })
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

    public getMoreItems() {
        if (this.nextRequest != this.prevRequest)
            return;
        
        this.startIndex += Constants.Products.productStart;
    }

}
