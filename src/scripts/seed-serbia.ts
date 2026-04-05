import { CreateInventoryLevelInput, ExecArgs } from '@medusajs/framework/types';
import { ContainerRegistrationKeys, Modules, ProductStatus } from '@medusajs/framework/utils';
import { createWorkflow, transform, WorkflowResponse } from '@medusajs/framework/workflows-sdk';
import {
	createApiKeysWorkflow,
	createInventoryLevelsWorkflow,
	createProductCategoriesWorkflow,
	createProductsWorkflow,
	createRegionsWorkflow,
	createSalesChannelsWorkflow,
	createShippingOptionsWorkflow,
	createShippingProfilesWorkflow,
	createStockLocationsWorkflow,
	createTaxRegionsWorkflow,
	createTaxRatesWorkflow,
	linkSalesChannelsToApiKeyWorkflow,
	linkSalesChannelsToStockLocationWorkflow,
	updateStoresStep,
	updateStoresWorkflow
} from '@medusajs/medusa/core-flows';
import { ApiKey } from '../../.medusa/types/query-entry-points';

const updateStoreCurrencies = createWorkflow(
	'update-store-currencies',
	(input: {
		supported_currencies: { currency_code: string; is_default?: boolean }[];
		store_id: string;
	}) => {
		const normalizedInput = transform({ input }, (data) => {
			return {
				selector: { id: data.input.store_id },
				update: {
					supported_currencies: data.input.supported_currencies.map((currency) => {
						return {
							currency_code: currency.currency_code,
							is_default: currency.is_default ?? false
						};
					})
				}
			};
		});

		const stores = updateStoresStep(normalizedInput);

		return new WorkflowResponse(stores);
	}
);

export default async function seedSerbiaData({ container }: ExecArgs) {
	const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
	const link = container.resolve(ContainerRegistrationKeys.LINK);
	const query = container.resolve(ContainerRegistrationKeys.QUERY);
	const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
	const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
	const storeModuleService = container.resolve(Modules.STORE);

	// Serbia ISO country code
	const country = 'rs';

	logger.info('Seeding store data for Serbia...');
	const [store] = await storeModuleService.listStores();
	let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
		name: 'Default Sales Channel'
	});

	if (!defaultSalesChannel.length) {
		// create the default sales channel
		const { result: salesChannelResult } = await createSalesChannelsWorkflow(container).run({
			input: {
				salesChannelsData: [
					{
						name: 'Default Sales Channel'
					}
				]
			}
		});
		defaultSalesChannel = salesChannelResult;
	}

	// Set Serbian Dinar (RSD) as the currency
	await updateStoreCurrencies(container).run({
		input: {
			store_id: store.id,
			supported_currencies: [
				{
					currency_code: 'rsd',
					is_default: true
				}
			]
		}
	});

	await updateStoresWorkflow(container).run({
		input: {
			selector: { id: store.id },
			update: {
				default_sales_channel_id: defaultSalesChannel[0].id
			}
		}
	});

	logger.info('Seeding region data for Serbia...');
	const { result: regionResult } = await createRegionsWorkflow(container).run({
		input: {
			regions: [
				{
					name: 'Serbia',
					currency_code: 'rsd',
					countries: [country],
					// Using manual payment provider for Cash on Delivery
					payment_providers: ['pp_system_default']
				}
			]
		}
	});
	const region = regionResult[0];
	logger.info('Finished seeding regions.');

	logger.info('Seeding tax regions for Serbia...');
	const { result: taxRegionResult } = await createTaxRegionsWorkflow(container).run({
		input: [
			{
				country_code: country,
				provider_id: 'tp_system',
				// Serbia standard VAT rate: 20%
				default_tax_rate: {
					rate: 20,
					name: 'Standard VAT',
					code: 'VAT_20'
				}
			}
		]
	});
	const taxRegion = taxRegionResult[0];

	// Add reduced VAT rate (10%) for specific products
	logger.info('Adding reduced VAT rate (10%) for Serbia...');
	await createTaxRatesWorkflow(container).run({
		input: [
			{
				tax_region_id: taxRegion.id,
				name: 'Reduced VAT',
				code: 'VAT_10',
				rate: 10,
				is_default: false
			}
		]
	});
	logger.info('Finished seeding tax regions and rates.');

	logger.info('Seeding stock location data...');
	const { result: stockLocationResult } = await createStockLocationsWorkflow(container).run({
		input: {
			locations: [
				{
					name: 'Serbia Warehouse',
					address: {
						city: 'Belgrade',
						country_code: country.toUpperCase(),
						address_1: ''
					}
				}
			]
		}
	});
	const stockLocation = stockLocationResult[0];

	await updateStoresWorkflow(container).run({
		input: {
			selector: { id: store.id },
			update: {
				default_location_id: stockLocation.id
			}
		}
	});

	// Link stock location to manual fulfillment provider
	await link.create({
		[Modules.STOCK_LOCATION]: {
			stock_location_id: stockLocation.id
		},
		[Modules.FULFILLMENT]: {
			fulfillment_provider_id: 'manual_manual'
		}
	});

	logger.info('Seeding fulfillment data...');
	const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
		type: 'default'
	});
	let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;

	if (!shippingProfile) {
		const { result: shippingProfileResult } = await createShippingProfilesWorkflow(container).run({
			input: {
				data: [
					{
						name: 'Default Shipping Profile',
						type: 'default'
					}
				]
			}
		});
		shippingProfile = shippingProfileResult[0];
	}

	const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
		name: 'Serbia Delivery',
		type: 'shipping',
		service_zones: [
			{
				name: 'Serbia',
				geo_zones: [
					{
						country_code: country,
						type: 'country'
					}
				]
			}
		]
	});

	await link.create({
		[Modules.STOCK_LOCATION]: {
			stock_location_id: stockLocation.id
		},
		[Modules.FULFILLMENT]: {
			fulfillment_set_id: fulfillmentSet.id
		}
	});

	// Create shipping options with RSD pricing
	await createShippingOptionsWorkflow(container).run({
		input: [
			{
				name: 'Standard Delivery',
				price_type: 'flat',
				provider_id: 'manual_manual',
				service_zone_id: fulfillmentSet.service_zones[0].id,
				shipping_profile_id: shippingProfile.id,
				type: {
					label: 'Standard',
					description: 'Delivery in 3-5 business days.',
					code: 'standard'
				},
				prices: [
					{
						currency_code: 'rsd',
						amount: 500 // 500 RSD (~$4.50 USD)
					},
					{
						region_id: region.id,
						amount: 500
					}
				],
				rules: [
					{
						attribute: 'enabled_in_store',
						value: 'true',
						operator: 'eq'
					},
					{
						attribute: 'is_return',
						value: 'false',
						operator: 'eq'
					}
				]
			},
			{
				name: 'Express Delivery',
				price_type: 'flat',
				provider_id: 'manual_manual',
				service_zone_id: fulfillmentSet.service_zones[0].id,
				shipping_profile_id: shippingProfile.id,
				type: {
					label: 'Express',
					description: 'Delivery in 1-2 business days.',
					code: 'express'
				},
				prices: [
					{
						currency_code: 'rsd',
						amount: 1000 // 1000 RSD (~$9 USD)
					},
					{
						region_id: region.id,
						amount: 1000
					}
				],
				rules: [
					{
						attribute: 'enabled_in_store',
						value: 'true',
						operator: 'eq'
					},
					{
						attribute: 'is_return',
						value: 'false',
						operator: 'eq'
					}
				]
			}
		]
	});
	logger.info('Finished seeding fulfillment data.');

	await linkSalesChannelsToStockLocationWorkflow(container).run({
		input: {
			id: stockLocation.id,
			add: [defaultSalesChannel[0].id]
		}
	});
	logger.info('Finished seeding stock location data.');

	logger.info('Seeding publishable API key data...');
	let publishableApiKey: ApiKey | null = null;
	const { data } = await query.graph({
		entity: 'api_key',
		fields: ['id'],
		filters: {
			type: 'publishable'
		}
	});

	publishableApiKey = data?.[0];

	if (!publishableApiKey) {
		const {
			result: [publishableApiKeyResult]
		} = await createApiKeysWorkflow(container).run({
			input: {
				api_keys: [
					{
						title: 'Serbia Webshop',
						type: 'publishable',
						created_by: ''
					}
				]
			}
		});

		publishableApiKey = publishableApiKeyResult as ApiKey;
	}

	await linkSalesChannelsToApiKeyWorkflow(container).run({
		input: {
			id: publishableApiKey.id,
			add: [defaultSalesChannel[0].id]
		}
	});
	logger.info('Finished seeding publishable API key data.');

	logger.info('Seeding product categories...');
	const { result: categoryResult } = await createProductCategoriesWorkflow(container).run({
		input: {
			product_categories: [
				{
					name: 'Sample Category',
					is_active: true
				}
			]
		}
	});
	logger.info('Finished seeding product categories.');

	logger.info('Seeding sample product...');
	await createProductsWorkflow(container).run({
		input: {
			products: [
				{
					title: 'Sample Product',
					category_ids: [categoryResult.find((cat) => cat.name === 'Sample Category')!.id],
					description: 'This is a sample product for testing purposes.',
					handle: 'sample-product',
					weight: 500,
					status: ProductStatus.PUBLISHED,
					shipping_profile_id: shippingProfile.id,
					options: [
						{
							title: 'Size',
							values: ['S', 'M', 'L']
						}
					],
					variants: [
						{
							title: 'S',
							sku: 'SAMPLE-S',
							options: {
								Size: 'S'
							},
							prices: [
								{
									amount: 2000, // 2000 RSD with 20% VAT included
									currency_code: 'rsd'
								}
							]
						},
						{
							title: 'M',
							sku: 'SAMPLE-M',
							options: {
								Size: 'M'
							},
							prices: [
								{
									amount: 2000,
									currency_code: 'rsd'
								}
							]
						},
						{
							title: 'L',
							sku: 'SAMPLE-L',
							options: {
								Size: 'L'
							},
							prices: [
								{
									amount: 2000,
									currency_code: 'rsd'
								}
							]
						}
					],
					sales_channels: [
						{
							id: defaultSalesChannel[0].id
						}
					]
				}
			]
		}
	});
	logger.info('Finished seeding product data.');

	logger.info('Seeding inventory levels.');
	const { data: inventoryItems } = await query.graph({
		entity: 'inventory_item',
		fields: ['id']
	});

	const inventoryLevels: CreateInventoryLevelInput[] = [];
	for (const inventoryItem of inventoryItems) {
		const inventoryLevel = {
			location_id: stockLocation.id,
			stocked_quantity: 100,
			inventory_item_id: inventoryItem.id
		};
		inventoryLevels.push(inventoryLevel);
	}

	await createInventoryLevelsWorkflow(container).run({
		input: {
			inventory_levels: inventoryLevels
		}
	});

	logger.info('Finished seeding inventory levels data.');
	logger.info('✅ Serbia store setup complete!');
	logger.info('---');
	logger.info('Region: Serbia (RS)');
	logger.info('Currency: RSD (Serbian Dinar)');
	logger.info('VAT Rate: 20% (standard)');
	logger.info('Payment: Manual (Cash on Delivery)');
	logger.info('Fulfillment: Manual (Owner-managed shipping)');
}
