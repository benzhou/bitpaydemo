Demo Bitcoin Payment System. *(powered by Bitpay)*.
===

A simple demo system that are running in AWS. [click here](http://bitpaydemo.sinonovatechnology.com:3001/demoservice) to visit.

The demo system's home page lists all products that are been added. Use the "Add Products" link in the menu to add more products. You can click on one product to go to "check out" interface. use your copay app to scan the QR code. The site will know that you have paid and redirect to the "Thank you for the payment" page.

### Security Considerations and TODO items
	*. SSL for all enpoints
	*. Need to verify the amount of BTC that receving address received is more than the price of the product. It is possible to receive less or more BTC that what the product is priced.

### Issues
	*. This [document](https://bitcore.io/guides/service-development) asked to use synlink to reference the service code from the bitcore node node_modules folder, however, this doesn't seems working very well when service folder has it's own npm_modules folder. An error of multiple bitcore-lib instances shows when I do `bitcore-node start`