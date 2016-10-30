Demo Bitcoin Payment System. *(powered by Bitpay)*.
===

A simple demo system is running in AWS. [click here](http://bitpaydemo.sinonovatechnology.com:3001/demoservice) to visit.

The demo system's home page lists all products that have been added. Use the "Add Products" link in the menu to add more products. You can click on the "buy" button to go to the "check out" interface. Use copay app to scan the QR code or send any amount to the address on the "check out" page. The site will know once you have paid the correct amount of bitcoins and then redirect to the "Thank you for the payment" page. If you partially paid, as long as the total amount paid is not exceeding the price of the product, the page will stay until the full amount is paid. (Can be not exact amount, as long as it is exceeding the full price.)

Each payment session will open a "store transaction" in our DB. you can view last 10 transactions by clicking on the "view transactions" link on the navigation menu. Once full payment has been made, the store transaction will be closed. Otherwise it would still consider as a open transactions. For this demo, the server side nodejs code is listening bitcored's "tx" event and determins whether or not a payment for a particular "store transaction" has been made. The client side app, while on the "check out" page, will listen the "bitcoind/addresstxid" event, if any payment is made to the address in question, then it would check to see if this "store transaction" has been closed. If so, it redrects to the "check-out successful" page, otherwise, it will indicate partial payment has been made and remain payment required. (a potential enhance to made for accurate calculation in javascript: convert the unit in to integter number for remaining amount as float operation in javascript will causing inaccuracy. This has been done on the server side using bitcore.Unit class)

There are two models defined using mongoose schdule and model. validations and static methods are used. 

The hosted app is managed by pm2 as a daemon. For demo purpose, I opened port 3001 to access the web server. In a "real world" setup, a reverse proxy and load balancer will need to used. Therefore, stardard port 80 (or 443 for HTTPS) will be used. The bitcore node code and its configuration is in this [repo](https://github.com/benzhou/bitpaynode). 

### Security Considerations and TODO items
	
- SSL for all enpoints
- Close transactions if payment is not made by a configurable time period.
- For demo purpose, we don't have authentication system in place, therefore, anyone can add product and make payment. It obviously won't be the case in a "real system".

### Issues
	
- This [document](https://bitcore.io/guides/service-development) asked to use synlink to reference the service code from the bitcore node node_modules folder, however, this doesn't seems working very well when service folder has it's own npm_modules folder. An error of multiple bitcore-lib instances shows when I do `bitcore-node start`