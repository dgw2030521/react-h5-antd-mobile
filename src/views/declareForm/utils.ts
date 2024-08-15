import { each, map } from 'lodash-es';
import { SpecialHandledCode } from '@CodeDefine/customer/SpecialHandledCode';
import { PolicyGetMetaRO } from '@CodeDefine/customer/PolicyGetMetaRO';
import { PolicyMetaConfigRO } from '@CodeDefine/customer/PolicyMetaConfigRO';
import { token_name } from '@/utils/constant';

export type SchemaRowDefine = Partial<PolicyMetaConfigRO> & { FormSchema: any };

const demoSchema = {
  type: 'object',
  properties: {
    obj: {
      type: 'object',
      title: '卡片主题',
      description: '这是一个对象类型',
      widget: 'formBox',
      props: { expand: true },
      properties: {
        picker: {
          title: 'picker',
          type: 'array',
          widget: 'picker',
          required: true,
          enum: ['a', 'b', 'c'],
          enumNames: ['早', '中', '晚'],
          // props: {
          //   options: [
          //     { label: '火车', value: 1 },
          //     { label: '飞机', value: 2 },
          //     { label: '火箭', value: 3 },
          //   ],
          // },
        },
        input: {
          title: '输入框',
          type: 'string',
          widget: 'input',
          required: true,
          placeholder: '请输入内容',
          defaultValue: '11111',
        },
        slider: {
          title: '滑动条',
          type: 'string',
          widget: 'slider',
        },
        switch: {
          title: '开关',
          type: 'bool',
          widget: 'switch',
          props: {
            uncheckedText: '关',
            checkedText: '开',
          },
        },
        stepper: {
          title: '步进器',
          type: 'number',
          widget: 'stepper',
        },
        selector: {
          // required: true,
          title: '选择组多选',
          type: 'string',
          widget: 'selector',
          props: {
            multiple: true,
            options: [
              { label: 'A', value: 'a' },
              { label: 'B', value: 'b' },
              { label: 'C', value: 'c' },
              { label: 'D', value: 'd' },
              { label: 'E', value: 'e' },
              { label: 'F', value: 'f' },
            ],
          },
        },
        selector2: {
          title: '选择组单选',
          type: 'string',
          widget: 'selector',
          enum: ['a', 'b', 'c'],
          enumNames: ['早', '中', '晚'],
        },
        radio: {
          title: '单选',
          type: 'string',
          widget: 'radio',
          enum: ['a', 'b', 'c'],
          enumNames: ['早', '中', '晚'],
          // props: {
          //   options: [
          //     { label: '早', value: 'a' },
          //     { label: '中', value: 'b' },
          //     { label: '晚', value: 'c' },
          //   ],
          // },
        },
        date: {
          title: '日期',
          type: 'string',
          widget: 'datePicker',
          props: {
            precision: 'month',
          },
        },
        city: {
          title: '城市',
          type: 'array',
          widget: 'cascader',
          props: {
            options: [
              {
                label: '浙江',
                value: 1,
                children: [{ label: '杭州', value: 2 }],
              },
            ],
          },
        },
      },
    },
    obj2: {
      type: 'object',
      title: '卡片主题',
      description: '这是一个对象类型',
      widget: 'formBox',
      properties: {
        picker: {
          title: 'picker',
          type: 'array',
          widget: 'picker',
          required: true,
          enum: ['a', 'b', 'c'],
          enumNames: ['早', '中', '晚'],
          // props: {
          //   options: [
          //     { label: '火车', value: 1 },
          //     { label: '飞机', value: 2 },
          //     { label: '火箭', value: 3 },
          //   ],
          // },
        },
        input: {
          title: '输入框',
          type: 'string',
          widget: 'input',
          required: true,
          placeholder: '请输入内容',
        },
        slider: {
          title: '滑动条',
          type: 'string',
          widget: 'slider',
        },
        switch: {
          title: '开关',
          type: 'bool',
          widget: 'switch',
          props: {
            uncheckedText: '关',
            checkedText: '开',
          },
        },
        stepper: {
          title: '步进器',
          type: 'number',
          widget: 'stepper',
        },
        selector: {
          // required: true,
          title: '选择组多选',
          type: 'string',
          widget: 'selector',
          props: {
            multiple: true,
            options: [
              { label: 'A', value: 'a' },
              { label: 'B', value: 'b' },
              { label: 'C', value: 'c' },
              { label: 'D', value: 'd' },
              { label: 'E', value: 'e' },
              { label: 'F', value: 'f' },
            ],
          },
        },
        selector2: {
          title: '选择组单选',
          type: 'string',
          widget: 'selector',
          enum: ['a', 'b', 'c'],
          enumNames: ['早', '中', '晚'],
        },
      },
    },
  },
};

/**
 * 将pc端的formSchema协议转为支持h5的
 * 1、类型 枚举在pc端对应的都是string，但在h5对应的widget取值都是array
 * 2、内置支持的组件重新映射，比如select等
 *
 * readOnlyWidget 指定只读渲染组件
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
    if (value.readOnly) {
      value.disabled = true;
    }
    // const enums = value.enum;
    // const enumNames = value.enumNames;
    // 单纯的input
    if (value.type === 'string' && !value.widget) {
      value.widget = 'input';
      // widget: 'textArea',
      value.placeholder = '请输入内容';
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
      value.props = {
        precision: 'day',
      };
    }
    //  时间
    if (value.type === 'string' && value.format === 'dateTime') {
      value.widget = 'datePicker';
      value.props = {
        precision: 'minute',
      };
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
 * @param metaConfig
 */
const flattenMetaList = (metaConfig: PolicyGetMetaRO) => {
  const returnList: PolicyMetaConfigRO[][] = [];
  returnList.push(metaConfig.metaList);
  each(metaConfig.tabList, tabItem => {
    if (!tabItem.Deleted) {
      const newMetaList = map(tabItem.MetaList, metaItem => {
        metaItem.Name = `${metaItem.Name}`;
        return metaItem;
      });
      returnList.push(newMetaList);
    }
  });

  return returnList;
};
/**
 * 生成申报表单
 * @param metaListSet
 * @param options
 * @param initialValues
 * @param defaultExpand 免申都打开，需要申报的就打开默认的
 */
const createFormSchemaByMetaList = (
  metaListSet: PolicyMetaConfigRO[][],
  options?: { companyBank: any; personBank: any },
  initialValues?: any,
  defaultExpand?: boolean,
) => {
  console.log('initialValues', initialValues);
  const returnSchema = {
    type: 'object',
    properties: {},
  };
  each(metaListSet, metaList => {
    metaList.forEach(item => {
      const formSchema = JSON.parse(item.metaFormRO.FormSchema);
      const eachMetaListProps = {
        type: 'object',
        title: `${item.Name}`,
        description: '',
        widget: 'formBox',
        props: { expand: defaultExpand || item.AsDefault },
        properties: {},
      };
      console.log('formSchema!!!', JSON.parse(item.metaFormRO.FormSchema));
      // 直接在原formSchema对象上修改
      reMapWidget(formSchema, options);
      eachMetaListProps.properties = formSchema.properties;
      returnSchema.properties[item.Meta.ID] = eachMetaListProps;
    });
  });
  console.log('@@@@returnSchema', returnSchema);
  return returnSchema;
};

export { reMapWidget, flattenMetaList, createFormSchemaByMetaList, demoSchema };
