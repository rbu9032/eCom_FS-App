import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartItem } from 'src/app/common/cart-item';
import { Product } from 'src/app/common/product';
import { CartService } from 'src/app/services/cart.service';
import { ProductService } from 'src/app/services/product.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {

  products: Product[] = [];
  currentCategoryId: number = 1;
  previousCateogryId: number = 1;
  // currentCategoryName: string = "";
  searchMode:boolean = false;

  //new properties for pagination
  thePageNumber: number = 1;
  thePageSize: number = 5;
  theTotalElements: number = 0;

  previousKeyword: string = "";
  

  constructor(private productService: ProductService,
              private cartService: CartService,
              private route: ActivatedRoute) { }
   
  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      this.listProducts();
    });
    
  }
  listProducts() {

    this.searchMode = this.route.snapshot.paramMap.has('keyword');

    if(this.searchMode){
      this.handleSearchProducts();
    }
    else{
      this.handleListProducts();
    }


  }
  handleSearchProducts() {
   const theKeyword: string = this.route.snapshot.paramMap.get('keyword')!;

   //if we have a different keyword than previous
   //then set the page number to 1

   if(this.previousKeyword != theKeyword){
    this.thePageNumber = 1;
   }

   this.previousKeyword = theKeyword;
   console.log(`keyword=${theKeyword}, thePageNUmber=${this.thePageNumber}`);

   //now search for the products using keyword
    this.productService.searchProductsPaginate(this.thePageNumber - 1,
                                               this.thePageSize,
                                               theKeyword).subscribe(this.processResult());
   
    }
 

    handleListProducts(){

      //check if "id" parameter is available
      const hasCategoryId: boolean = this.route.snapshot.paramMap.has('id');
  
      if(hasCategoryId){
        //get the "id" param string convert string to a number using the "+" symbol
        this.currentCategoryId = +this.route.snapshot.paramMap.get('id')!;
  
        //  // get the "name" param string
        //  this.currentCategoryName = this.route.snapshot.paramMap.get('name')!;
      }
      else{
        //no category id is available .. default to category id 1
        this.currentCategoryId = 1;
        // this.currentCategoryName = 'Books';
      }

      //
      //Check if we have a different category than previous
      //Note: Angular will reuse a component if it is currently being viewed
      //

      //if we have a different category id than previous
      //then ser thePageNumber back to 1 
      if(this.previousCateogryId != this.currentCategoryId){
        this.thePageNumber = 1;
      }

      this.previousCateogryId = this.currentCategoryId;

      console.log(`currentCategoryId=${this.currentCategoryId}, thePageNumber=${this.thePageNumber}`);

      //now get the products for the given categpry id
      this.productService.getProductListPaginate(this.thePageNumber -1,
                                                 this.thePageSize,
                                                 this.currentCategoryId)
                                                 .subscribe(this.processResult());
  
     }


     processResult(){
      return (data: any) => {
        this.products = data._embedded.products;
        this.thePageNumber = data.page.number + 1;
        this.thePageSize = data.page.size;
        this.theTotalElements = data.page.totalElements;
      };
   }

     updatePageSize(pageSize: string){
       this.thePageSize = +pageSize;
       this.thePageNumber = 1;
       this.listProducts();
     }


     addToCart(theProdcut: Product){

      console.log(`Adding to cart: ${theProdcut.name}, ${theProdcut.unitPrice}`);
     
      const theCartItem  = new CartItem(theProdcut);

      this.cartService.addToCart(theCartItem);

     }
    
  }

  



