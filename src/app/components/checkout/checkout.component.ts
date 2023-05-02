import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OktaAuthStateService } from '@okta/okta-angular';
import { City } from 'src/app/common/city';
import { Order } from 'src/app/common/order';
import { OrderItem } from 'src/app/common/order-item';
import { PaymentInfo } from 'src/app/common/payment-info';
import { Purchase } from 'src/app/common/purchase';
import { State } from 'src/app/common/state';
import { CartService } from 'src/app/services/cart.service';
import { CheckoutService } from 'src/app/services/checkout.service';
import { ShopFormService } from 'src/app/services/shop-form.service';
import { Luv2ShopValidators } from 'src/app/validators/luv2-shop-validators';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {


  checkoutFormGroup: FormGroup;
  
  totalPrice: number = 0;
  totalQuantity: number = 0;

  creditCardYears: number[] = [];
  creditCardMonths: number[] = [];

  states: State[] = [];

  shippingAddressCities: City[] = [];
  billingAddressCities: City[] = [];
  storage: Storage = sessionStorage;

  isDisabled: boolean = false;
  isAuthenticated: boolean = false;
  
 // initialize Stripe API
 stripe = Stripe(environment.stripePublishableKey);

 paymentInfo: PaymentInfo = new PaymentInfo();
 cardElement: any;
 displayError: any = "";
  

  constructor(private formBuilder: FormBuilder,
              private shopFormService: ShopFormService,
              private cartService: CartService,
              private checkoutService: CheckoutService,
              private router: Router,
              private oktaAuthService: OktaAuthStateService) { }

  ngOnInit(): void {

     //subscribe to authenticated state changes
    this.oktaAuthService.authState$.subscribe(
      (result) => {
        this.isAuthenticated = result.isAuthenticated;
      }
    )

    //call a method to setup stripe form
    this.setupStripePaymentForm();

    this.reviewCartDetails();

    //read the user's email address from browser storage
    const theEmail = JSON.parse(this.storage.getItem('userEmail')!);

    this.checkoutFormGroup = this.formBuilder.group({
      customer: this.formBuilder.group({
        firstName:new FormControl('', [Validators.required, Luv2ShopValidators.notOnlyWhiteSpace,Validators.pattern('^[a-zA-Z\\s]*$'), Validators.minLength(2), Validators.maxLength(50)]),
        lastName: new FormControl('', [Validators.required, Luv2ShopValidators.notOnlyWhiteSpace,Validators.pattern('^[a-zA-Z\\s]*$'), Validators.minLength(2), Validators.maxLength(50)]),
        email: new FormControl(theEmail, [Validators.required, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')])
      }),
      shippingAddress: this.formBuilder.group({
        doorNo: new FormControl('', [Validators.required, Validators.pattern('^([1-9][0-9\\da-zA-Z\\d-]*)$'), Validators.maxLength(12)]),
        street: new FormControl('', [Validators.required,  Validators.minLength(5), Luv2ShopValidators.notOnlyWhiteSpace, Validators.maxLength(100)]),
        city: new FormControl('', [Validators.required]),
        state:  new FormControl('', [Validators.required]),
        zipCode: new FormControl('', [Validators.required, Validators.pattern('[0-9]{6}')]),
        contactNo: new FormControl('', [Validators.required, Validators.pattern('[0-9]{10}')])
      }),
      billingAddress: this.formBuilder.group({
        doorNo: new FormControl('', [Validators.required, Validators.pattern('^([1-9][0-9\\da-zA-Z\\d-]*)$'), Validators.maxLength(12)]),
        street: new FormControl('', [Validators.required, Luv2ShopValidators.notOnlyWhiteSpace, Validators.minLength(5), Validators.maxLength(100)]),
        city: new FormControl('', [Validators.required]),
        state:  new FormControl('', [Validators.required]),
        zipCode: new FormControl('', [Validators.required, Validators.pattern('[0-9]{6}')]),
        contactNo: new FormControl('', [Validators.required, Validators.pattern('[0-9]{10}')])
      }),
      creditCard: this.formBuilder.group({
      // cardType:  new FormControl('', [Validators.required]),
      // nameOnCard: new FormControl('', [Validators.required, Luv2ShopValidators.notOnlyWhiteSpace,Validators.pattern('^[a-zA-Z\\s]*$'), Validators.minLength(2), Validators.maxLength(50)]),
      // cardNumber: new FormControl('', [Validators.required, Validators.pattern('[0-9]{16}')]),
      // expirationMonth: [''],
      // expirationYear: [''],
      // cvv: new FormControl('', [Validators.required, Validators.pattern('[0-9]{3}')])
      })
    });

 
    //    // populate credit card months

    // const startMonth: number = new Date().getMonth() + 1;
    // console.log("startMonth: " + startMonth);

    // this.shopFormService.getCreditCardMonths(startMonth).subscribe(
    //   data => {
    //     console.log("Retrieved credit card months: " + JSON.stringify(data));
    //     this.creditCardMonths = data;
    //   }
    // );

    // // populate credit card years

    // this.shopFormService.getCreditCardYears().subscribe(
    //   data => {
    //     console.log("Retrieved credit card years: " + JSON.stringify(data));
    //     this.creditCardYears = data;
    //   }
    // );

    // populate states
    this.shopFormService.getStates().subscribe(
      data => {
        console.log("Retrieved countries: " + JSON.stringify(data));
        this.states = data;
      }
    );

  }
  setupStripePaymentForm() {

    //get a handle to stripe elements
      var elements = this.stripe.elements();

    //Create a card element ... and hide the zip-code field
      this.cardElement = elements.create('card', {hidePostalCode: true});

    //Add an instance of card UI component into the 'card-element'div
      this.cardElement.mount('#card-element');

    //Add event binding for the 'change' event on the card element
     this.cardElement.on('change', (event) => {
        
      //get a handle to card-errors element
      this.displayError = document.getElementById('card-errors');

      if(event.complete) {
        this.displayError.textContent = "";
      }else if (event.error){
        //show validation error to customer
        this.displayError.textContent = event.error.message;
      }
     });
  }
  reviewCartDetails() {
    
    //subscribe to cartService.totalQuantity
    this.cartService.totalQuantity.subscribe(
      totalQuantity => this.totalQuantity = totalQuantity
    );
    //subscribe to cartService.totalQuantity
    this.cartService.totalPrice.subscribe(
      totalPrice => this.totalPrice = totalPrice
    );
    
  }

       //getters method to access form control
       //customer
       get firstName() { return this.checkoutFormGroup.get('customer.firstName');}
       get lastName() { return this.checkoutFormGroup.get('customer.lastName');}
       get email() { return this.checkoutFormGroup.get('customer.email');}

       //shippingAddress
          get shippingAddressdoorNo() { return this.checkoutFormGroup.get('shippingAddress.doorNo');}
          get shippingAddressstreet() { return this.checkoutFormGroup.get('shippingAddress.street');}
          get shippingAddresscity() { return this.checkoutFormGroup.get('shippingAddress.city');}
          get shippingAddressstate() { return this.checkoutFormGroup.get('shippingAddress.state');}
          get shippingAddresszipCode() { return this.checkoutFormGroup.get('shippingAddress.zipCode');}
          get shippingAddresscontactNo() { return this.checkoutFormGroup.get('shippingAddress.contactNo');}
       
       //billingAddress
       get billingAddresssdoorNo() { return this.checkoutFormGroup.get('billingAddress.doorNo');}
       get billingAddressstreet() { return this.checkoutFormGroup.get('billingAddress.street');}
       get billingAddresscity() { return this.checkoutFormGroup.get('billingAddress.city');}
       get billingAddressstate() { return this.checkoutFormGroup.get('billingAddress.state');}
       get billingAddresszipCode() { return this.checkoutFormGroup.get('billingAddress.zipCode');}
       get billingAddresscontactNo() { return this.checkoutFormGroup.get('billingAddress.contactNo');}

       //creditCart
      //  get creditCardcardType() { return this.checkoutFormGroup.get('creditCard.cardType');}
      //  get creditCardnameOnCard() { return this.checkoutFormGroup.get('creditCard.nameOnCard');}
      //  get creditCardcardNumber() { return this.checkoutFormGroup.get('creditCard.cardNumber');}
      //  get creditCardcvv() { return this.checkoutFormGroup.get('creditCard.cvv');}

  copyShippingAddressToBillingAddress(event){
     
    if(event.target.checked){
      this.checkoutFormGroup.controls['billingAddress']
           .setValue(this.checkoutFormGroup.controls['shippingAddress'].value);

           //bug fix code 
           this.billingAddressCities = this.shippingAddressCities;           
    }
    else{
      this.checkoutFormGroup.controls['billingAddress'].reset();
 
      //bug fix for cities
      this.billingAddressCities = [];      
    }
  }

  onSubmit(){
    console.log('Handling the submit the button');

    if(this.checkoutFormGroup.invalid){
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }
     //sending checkout form to data via REST API using SpringBoot  
    // set up order
     let order = new Order();
     order.totalPrice = this.totalPrice;
     order.totalQuantity = this.totalQuantity;

    //get cart items
      const cartItems = this.cartService.cartItems;

    // create orderItems from cartItems
    // --long way
    // let orderItems:OrderItem[] = [];
    // for(let i=0; i < cartItems.length; i++){
    //   orderItems[i] = new OrderItem(cartItems[i]);
    // }

    // -- short way of doing the same thing
    let orderItemsShort: OrderItem[] = cartItems.map(tempCartItem => new OrderItem(tempCartItem));

    //set up purchase
    let purchase = new Purchase();

    //populate purchase - customer
    purchase.customer = this.checkoutFormGroup.controls['customer'].value;

    //populate purchase - shippingAddress
    purchase.shippingAddress = this.checkoutFormGroup.controls['shippingAddress'].value;
    const shippingCity: City = JSON.parse(JSON.stringify(purchase.shippingAddress.city));
    const shippingState: State = JSON.parse(JSON.stringify(purchase.shippingAddress.state));
    purchase.shippingAddress.city = shippingCity.name;
    purchase.shippingAddress.state = shippingState.name;
 
    //populate purchase - billingAddress
    purchase.billingAddress = this.checkoutFormGroup.controls['billingAddress'].value;
    const billingCity: City = JSON.parse(JSON.stringify(purchase.billingAddress.city));
    const billingState: State = JSON.parse(JSON.stringify(purchase.billingAddress.state));
    purchase.billingAddress.city = billingCity.name;
    purchase.billingAddress.state =billingState.name;

    //populate purchase - order and orderItems
    purchase.order = order;
    purchase.orderItems = orderItemsShort;

    //compute payment info
    this.paymentInfo.amount = Math.round(this.totalPrice * 100);
    this.paymentInfo.currency = "INR";
    this.paymentInfo.receiptEmail = purchase.customer.email;

    console.log(`this.paymentInfo.amount: ${this.paymentInfo.amount}`);
    
    //if valid form then
    // create payment intent
    // confirm card payment
    // place order  

    if(!this.checkoutFormGroup.invalid && this.displayError.textContent === "") {
      
      this.isDisabled = true;
      this.checkoutService.createPaymentIntent(this.paymentInfo).subscribe(    //createPaymentIntent behind the scenes it will create payment intent by calling the spring boot rest API
        (paymentIntentResponse) => {
          this.stripe.confirmCardPayment(paymentIntentResponse.client_secret,        //confirmCardPayment this will actually sened credit card data directly to stripe.com servers
            {
              payment_method: {
                card: this.cardElement,                              //references the Stripe Elements component: cardElement
                
                billing_details: {
                  email: purchase.customer.email,
                  name: `${purchase.customer.firstName} ${purchase.customer.lastName}`,
                  address: {
                    line1: purchase.billingAddress.street,
                    city: purchase.billingAddress.city,
                    state: purchase.billingAddress.state,
                    postal_code: purchase.billingAddress.zipCode
                  }
                }
              }
            }, { handleActions: false})
            .then((result: any) => {
              if(result.error) {
                //inform the customer there was an error
                  alert(`There was an error: ${result.error.message}`);
                 // this.isDisabled = false;
              }else {
               //call REST API via CheckoutService
               this.checkoutService.placeOrder(purchase).subscribe({                //placeOrder this will place the order by storing in the MySQL database using the spring boot rest API)                         
                  next: (response: any) => {
                    alert(`Your order has been received.\nOrder tracking number: ${response.orderTrackingNumber}`);

                    //  reset car
                    this.resetCart();
                    this.isDisabled = false;
                  },
                  error: (err: any) => {
                    alert(`There was an error: ${err.message}`);
                    this.isDisabled = false;
                  }
               })                      
              }
            });        
        }
      );
    } else {
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }

    // console.log(this.checkoutFormGroup.get('customer').value);
    // console.log(`The email address is ${this.checkoutFormGroup.get('customer').value.email}`);

    // console.log(`The shipping address state is ${this.checkoutFormGroup.get('shippingAddress').value.state.name}`);
    // console.log(`The shipping address state is ${this.checkoutFormGroup.get('shippingAddress').value.city.name}`);
  }


  resetCart() {
   
    //reset cart data
    this.cartService.cartItems = [];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);
    this.cartService.persistCartItems();

    //reset the form
    this.checkoutFormGroup.reset();

     // remove cartItems from session
     this.storage.removeItem('cartItems');

    //navigate back to the products page
    this.router.navigateByUrl("/products");
  }

  
  handleMonthsAndYears() {

    const creditCardFormGroup = this.checkoutFormGroup.get('creditCard');

    const currentYear: number = new Date().getFullYear();
    const selectedYear: number = Number(creditCardFormGroup.value.expirationYear);

    // if the current year equals the selected year, then start with the current month

    let startMonth: number;

    if (currentYear === selectedYear) {
      startMonth = new Date().getMonth() + 1;
    }
    else {
      startMonth = 1;
    }

    this.shopFormService.getCreditCardMonths(startMonth).subscribe(
      data => {
        console.log("Retrieved credit card months: " + JSON.stringify(data));
        this.creditCardMonths = data;
      }
    );
  }

  getCities(formGroupName: string) {

    const formGroup = this.checkoutFormGroup.get(formGroupName);

    const stateCode = formGroup.value.state.code;
    const stateName = formGroup.value.state.name;

    console.log(`${formGroupName} state code: ${stateCode}`);
    console.log(`${formGroupName} state name: ${stateName}`);

    this.shopFormService.getCities(stateCode).subscribe(
      data => {

        if (formGroupName === 'shippingAddress') {
          this.shippingAddressCities = data; 
        }
        else {
          this.billingAddressCities = data;
        }

        // select first item by default
        formGroup.get('city').setValue(data[0]);
      }
    );
  }
  
}




