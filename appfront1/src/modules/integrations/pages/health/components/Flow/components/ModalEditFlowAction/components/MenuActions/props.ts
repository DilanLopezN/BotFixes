import { FormikProps, FormikValues } from "formik";
import { I18nProps } from '../../../../../../../../../i18n/interface/i18n.interface';

export interface MenuActionsProps extends I18nProps {
  formik: FormikProps<FormikValues>;
  workspaceId: string;
}