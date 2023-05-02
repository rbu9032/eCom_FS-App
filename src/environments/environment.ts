// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  
    // add your custom environment configs
    luv2shopApiUrl: "https://localhost:8443/api",
    stripePublishableKey: "pk_test_51N116zSGMhgyZkruiZmhFiSmboo90DalT0R8gmzAr98kyXdnkH1hYvgkTGldaEwL3BGaNVnPCtuc3k9GBrS7t7B4000IbQkCai"   //used to identify your account with stripe. key isn't secret and safe to use un your frontend application
};

/* 
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
