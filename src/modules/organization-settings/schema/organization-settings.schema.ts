import * as mongoose from 'mongoose';
import { AfterFindSoftDeletePlugin } from '../../../common/mongoosePlugins/afterFindSoftDelete.plugin';
import { TimesmapPlugin } from '../../../common/mongoosePlugins/timestamp.plugin';
import { defaultExtensions, Extensions, OrganizationSettings, ScriptType } from '../interfaces/organization-settings.interface';
import { UserRoles } from '../../users/interfaces/user.interface';

const colorValidator = (v) => (/^#([0-9a-f]{3}){1,2}$/i).test(v);

export const ExtensionsSchema = new mongoose.Schema(
	{
		extension: {
			type: String,
			enum: [
				...Object.keys(Extensions),
			],
		},
		enable: {
			type: Boolean,
			required: true,
			default: false,
		},
		roles: [{
			type: String,
			enum: [
				...Object.keys(UserRoles),
			],
			required: false,
		}],
	},
	{ versionKey: false, _id: false },
);

export const ResponsesSchema = new mongoose.Schema(
	{
		type: String,
		name: String,
		title: String,
		icon: String,
		action: String,
	},
	{ versionKey: false, _id: false },
);

export const ResponseOptionsSchema = new mongoose.Schema(
	{
		name: String,
		responses: [ResponsesSchema],
	},
	{ versionKey: false, _id: false },
);

export const ResponsesTypeSchema = new mongoose.Schema(
	{
		name: String,
		title: String,
		icon: String,
		options: [ResponseOptionsSchema],
	},
	{ versionKey: false, _id: false },
);

export const LayoutSchema = new mongoose.Schema(
	{
		logo: {
			transparent: String,
			original: String,
		},
		color: {
			type: String,
			validate: [colorValidator, 'Invalid hexadecimal color'],
		},
		title: String,
	},
	{ versionKey: false, _id: false },
);

export const ScriptsSchema = new mongoose.Schema(
	{
		data: String,
		type: {
			type: String,
			enum: [
				...Object.keys(ScriptType),
			],
		},
	},
	{ versionKey: false, _id: true },
);

export const StylesSchema = new mongoose.Schema(
	{
		path: String,
	},
	{ versionKey: false, _id: true },
);

export const ChannelsSchema = new mongoose.Schema(
	{
		id: {
			type: String,
		},
		roles: [{
			type: String,
			enum: [
				...Object.keys(UserRoles),
			],
			required: false,
		}],
	},
	{ versionKey: false, _id: true },
);

export const HelpCenterSchema = new mongoose.Schema(
	{
		url: String,
		article: mongoose.Schema.Types.Mixed,
	},
	{ versionKey: false, _id: false },
);

export const OrganizationSettingsSchema = new mongoose.Schema(
	{
		organizationId: {
			required: true,
			type: String,
		},
		extensions: {
			type: [ExtensionsSchema],
			default: defaultExtensions,
		},
		layout: LayoutSchema,
		responses: [ResponsesTypeSchema],
		scripts: [ScriptsSchema],
		styles: [StylesSchema],
		channels: [ChannelsSchema],
		helpCenter: HelpCenterSchema,
	},
	{ versionKey: false, strictQuery: true },
);

OrganizationSettingsSchema.plugin(AfterFindSoftDeletePlugin);
OrganizationSettingsSchema.plugin(TimesmapPlugin);

export const OrganizationSettingsModel: mongoose.Model<OrganizationSettings> = mongoose.model<OrganizationSettings>(
	'OrganizationSettings',
	OrganizationSettingsSchema,
);
