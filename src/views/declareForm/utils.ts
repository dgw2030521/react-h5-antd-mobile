import { PolicyGetMetaRO } from '@CodeDefine/customer/PolicyGetMetaRO';
import { PolicyMetaConfigRO } from '@CodeDefine/customer/PolicyMetaConfigRO';
import { SpecialHandledCode } from '@CodeDefine/customer/SpecialHandledCode';
import { each, map } from 'lodash-es';

import { token_name } from '@/utils/constant';

export type SchemaRowDefine = Partial<PolicyMetaConfigRO> & { FormSchema: any };

const META_KEY = 'META';

/**
 * 将pc端的formSchema协议转为支持h5的
 * 1、类型 枚举在pc端对应的都是string，但在h5对应的widget取值都是array
 * 2、内置支持的组件重新映射，比如select等
 * 3、readOnlyWidget 指定只读渲染组件
 *
 * @param formSchema
 * @param options
 */
const reMapWidget = (
  formSchema: any,
  options?: { companyBank: any; personBank: any },
) => {
  const { companyBank, personBank } = options;

  each(formSchema.properties, (value: any, key) => {
    // 占位符
    if (value.title === ' ' && value.type === 'string') {
      //   识别为占位符
    }

    if (value.readOnly) {
      value.disabled = true;
    }

    // const enums = value.enum;
    // const enumNames = value.enumNames;
    // 单纯的input
    if (value.type === 'string' && !value.widget) {
      value.widget = 'input';
      value.placeholder = '请输入内容';
      // value.defaultValue = 'abc';
    }
    // 特殊数字展示，待unit
    if (value.type === 'number') {
      // type: 'number',
      // widget: 'stepper'
      value.widget = 'MyNumber';
    }
    // upload
    if (value.type === 'string' && value.widget === 'IOInvokerUpload') {
      value.widget = 'IOInvokerUpload';
      value.placeholder = '请上传';
      // h5的 token名称
      value.authorization = token_name || 'customer-h5-token';
      value.accept = 'image/*';
    }

    // 日期
    if (value.type === 'string' && value.format === 'date') {
      value.widget = 'datePicker';
      value.precision = 'day';
      value.format = 'YYYY-MM-DD';
    }
    //  时间
    if (value.type === 'string' && value.format === 'dateTime') {
      value.widget = 'datePicker';
      value.precision = 'minute';
      value.format = 'YYYY-MM-DD hh:mm';
    }
    // textarea
    if (value.type === 'string' && value.format === 'textarea') {
      value.widget = 'textArea';
      value.props = {
        showCount: true,
        autoSize: { minRows: 2, maxRows: 5 },
      };
    }

    // 下拉单选 picker
    if (value.widget === 'select') {
      // 内置的picker必须是array
      value.type = 'array';
      value.widget = 'picker';
      // 财务信息
      if (key === SpecialHandledCode.COMPANY_BANK_ID.Desc) {
        value.enumNames = companyBank.names;
        value.enum = companyBank.ids;
      }
      if (key === SpecialHandledCode.PERSON_BANK_ID.Desc) {
        value.enumNames = personBank.names;
        value.enum = personBank.ids;
      }
    }

    // radio
    // type: 'string', widget: 'radio',

    // 单独checkBox
    if (value.type === 'boolean' && value.widget === 'checkbox') {
      // value.widget = 'selector';

      // 当 title 未设置时，通过配置 reserveLabel: true，可以保留 labelWidth 占位，使得输入控件和其他控件上下对齐
      // value.reserveLabel = true;

      value.widget = 'MyCheckBoxSingle';
    }
    // 多选checkBox
    if (value.type === 'array' && value.widget === 'checkboxes') {
      value.type = 'array';

      // value.widget = 'selector';
      // value.props = {
      //   multiple: true,
      // };

      value.widget = 'MyCheckBoxMultiple';
    }

    // 下拉多选
    if (value.widget === 'multiSelect') {
      value.type = 'array';

      value.placeholder = '请选择';

      value.widget = 'MySelect';

      // value.widget = 'selector';
      // value.props = {
      //   multiple: true,
      // };
    }
  });
};

/**
 * 将metaConfig中的metaList和tabList打平
 * 因为不需要显示tab，所以建立新的metaList一维数组
 * @NOTICE 后续若需要区分tab，则建立一个以metaList为元素的二维数组
 * @param metaConfig
 */
const flattenMetaList = (metaConfig: PolicyGetMetaRO) => {
  let returnList: PolicyMetaConfigRO[] = [];
  returnList = [...metaConfig.metaList];
  each(metaConfig.tabList, tabItem => {
    if (!tabItem.Deleted) {
      const newMetaList = map(tabItem.MetaList, metaItem => {
        metaItem.Name = `${metaItem.Name}`;
        return metaItem;
      });
      returnList = [...returnList, ...newMetaList];
    }
  });

  return returnList;
};

/**
 * 以metaList为元素的二维数组，区分tab展示tab
 * @param metaConfig
 */
const flattenMetaListSecond = (metaConfig: PolicyGetMetaRO) => {
  const returnList: PolicyMetaConfigRO[][] = [];
  returnList.push(metaConfig.metaList);
  each(metaConfig.tabList, tabItem => {
    if (!tabItem.Deleted) {
      const newMetaList = map(tabItem.MetaList, metaItem => {
        metaItem.Name = `${tabItem.Name}-${metaItem.Name}`;
        return metaItem;
      });
      returnList.push(newMetaList);
    }
  });

  return returnList;
};
/**
 * 生成申报表单
 * @param metaLists
 * @param options
 * @param renderConfig 免申都打开，需要申报的就打开默认的
 * @param initialValues
 */
const createFormSchemaByMetaList = (
  metaLists: PolicyMetaConfigRO[],
  options: { companyBank: any; personBank: any; [index: string]: any },
  renderConfig: {
    /**
     * 默认展开
     */
    defaultExpand?: boolean;
    /**
     * 隐藏展开按钮
     */
    hideExpandBtn?: boolean;
    [index: string]: any;
  },
) => {
  const { defaultExpand, hideExpandBtn } = renderConfig;
  const returnSchema = {
    type: 'object',
    properties: {},
  };
  each(metaLists, item => {
    const formSchema = JSON.parse(item.metaFormRO.FormSchema);
    const eachMetaListProps = {
      type: 'object',
      title: `${item.Name}`,
      description: '',
      widget: 'formBox',
      props: { expand: defaultExpand || item.AsDefault, hideExpandBtn },
      properties: {},
    };
    const pcSchemata = JSON.parse(item.metaFormRO.FormSchema);
    console.log('!!!!pcSchemata', pcSchemata);
    reMapWidget(formSchema, options);
    eachMetaListProps.properties = formSchema.properties;
    const metaId = item.Meta.ID;
    returnSchema.properties[`${META_KEY}${metaId}`] = eachMetaListProps;
  });
  console.log('@@@@totalSchema', returnSchema);
  return returnSchema;
};

const convertInitialValueBySchemaDefine = (
  metaKey: string,
  fieldCode: string,
  metaValue: any,
  renderSchema: any,
) => {
  const matchedSchemaDefine =
    renderSchema.properties[metaKey].properties[fieldCode];

  const matchedType = matchedSchemaDefine?.type;

  if (matchedType === 'array' && typeof metaValue === 'string') {
    metaValue = [metaValue];
  }

  return metaValue;
};

export {
  convertInitialValueBySchemaDefine,
  createFormSchemaByMetaList,
  flattenMetaList,
  flattenMetaListSecond,
  META_KEY,
  reMapWidget,
};
