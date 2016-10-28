Demo Bitcoin Payment Sytem. *(powered by Bitpay)*.
===

### Security Considerations
	*. SSL for all enpoints

### Issues
	*. This [document](https://bitcore.io/guides/service-development) asked to use synlink to reference the service code from the bitcore node node_modules folder, however, this doesn't seems working very well when service folder has it's own npm_modules folder. An error of multiple bitcore-lib instances shows when I do `bitcore-node start`