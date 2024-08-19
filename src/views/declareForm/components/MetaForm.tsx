import { CustomerPolicyDetailRO } from '@CodeDefine/customer/CustomerPolicyDetailRO';
import { MetaFormFieldKeyValueRO } from '@CodeDefine/customer/MetaFormFieldKeyValueRO';
import { MetaFormRowRO } from '@CodeDefine/customer/MetaFormRowRO';
import { PolicyApplyFormRO } from '@CodeDefine/customer/PolicyApplyFormRO';
import { PolicyMatterType } from '@CodeDefine/customer/PolicyMatterType';
import { PolicyMetaConfigRO } from '@CodeDefine/customer/PolicyMetaConfigRO';
import FormRender from 'form-render-mobile';
import { each, isEmpty } from 'lodash-es';
import React, { useEffect, useState } from 'react';

import styles from '@/views/declareForm/index.module.scss';
import useDeclareForm from '@/views/declareForm/useDeclareForm';
import {
  convertInitialValueBySchemaDefine,
  createFormSchemaByMetaList,
  flattenMetaList,
  META_KEY,
} from '@/views/declareForm/utils';
import FormBox from '@/views/declareForm/widgets/formBox';
import IOInvokerUpload from '@/views/declareForm/widgets/IOInvokerUpload';
import MyLink from '@/views/declareForm/widgets/link';
import MyCheckBoxMultiple from '@/views/declareForm/widgets/MyCheckBoxMultiple';
import MyCheckBoxSingle from '@/views/declareForm/widgets/MyCheckBoxSingle';
import MyNumber from '@/views/declareForm/widgets/MyNumber';
import MySelect from '@/views/declareForm/widgets/MySelect';

interface MetaFormProps {
  bodyId: string;
  form: any;
  readOnly?: boolean;
  policyInfo: CustomerPolicyDetailRO;
  draftDetail: PolicyApplyFormRO;
}

export default function MetaForm(props: MetaFormProps) {
  const { form, readOnly, policyInfo, draftDetail, bodyId } = props;
  const [renderSchema, setRenderSchema] = useState({});
  const [metaValues, setMetaValues] = useState({});
  const [metaListArr, setMetaListArr] = useState<PolicyMetaConfigRO[]>(null);
  const [loadForm, setLoadForm] = useState(false);

  const {
    getPolicyConfigMeta,
    getCompanyBank,
    getPersonBank,
    getDraftMetaDetailByMetaID,
    getApplyInfo,
  } = useDeclareForm();

  /**
   * 获取meta信息并根据draftId设置初始值
   * @param $bodyId
   * @param draftId
   * @param defaultExpand 获取policy类型是免申还是需要申报
   */
  const getMetaDetail = async (
    $bodyId: string,
    draftId: string,
    defaultExpand: boolean,
  ) => {
    const companyBank = await getCompanyBank();
    const personBank = await getPersonBank();
    const meta = await getPolicyConfigMeta($bodyId);
    const metaListArr = flattenMetaList(meta);

    console.log('####flatten metaList', metaListArr);

    const $renderSchema = createFormSchemaByMetaList(
      metaListArr,
      {
        companyBank,
        personBank,
      },
      { defaultExpand },
    );

    setRenderSchema($renderSchema);
    setMetaListArr(metaListArr);

    // const initValues = await initFormValues(
    //   metaListArr,
    //   draftId,
    //   $renderSchema,
    // );
    // setMetaValues(initValues);
  };

  /**
   * 获取meta表单
   * @param $bodyId
   * @param draftId
   */
  const getApplyFormConfigDetail = async ($bodyId: string, draftId: string) => {
    const defaultExpand =
      policyInfo.PolicyMatterType._value === PolicyMatterType.NO_APPLY.Value;

    await getMetaDetail($bodyId, draftId, defaultExpand);
  };

  useEffect(() => {
    if (!bodyId || isEmpty(draftDetail)) return;
    getApplyFormConfigDetail(bodyId, draftDetail.ID);
  }, [draftDetail?.ID, bodyId]);

  /**
   * 初始化表单值
   * @param metaLists
   * @param draftId
   * @param renderSchema
   */
  const initFormValues = async (
    metaLists: PolicyMetaConfigRO[],
    draftId: string,
    renderSchema: any,
  ) => {
    const metaValues = {};
    if (draftId !== '0') {
      // 有草稿
      // http://172.27.237.121:31954/zczd/customer/policy/1824049265748606976/declare?draftId=1824265977328697344
      each(metaLists, meta => {
        const metaId = meta.Meta.ID;
        metaValues[`${META_KEY}${metaId}`] = {};
        getDraftMetaDetailByMetaID(draftId, metaId).then(
          (res: MetaFormRowRO[]) => {
            each(res[0].DataFieldList, (metaField: MetaFormFieldKeyValueRO) => {
              const { Code, Value } = metaField;
              const metaKey = `${META_KEY}${metaId}`;
              const convertValue = convertInitialValueBySchemaDefine(
                metaKey,
                Code,
                Value,
                renderSchema,
              );
              metaValues[`${metaKey}`][`${Code}`] = convertValue;
              form.setValueByPath(`${metaKey}.${Code}`, convertValue);
            });
          },
        );
      });
    } else {
      //  无草稿
      // http://172.27.237.121:31954/zczd/customer/policy/777/declare
      // getApplyInfo(metaId,draftId);
      each(metaLists, meta => {
        const metaId = meta.Meta.ID;
        metaValues[`${META_KEY}${metaId}`] = {};
        getApplyInfo(metaId, draftId).then((res: MetaFormFieldKeyValueRO[]) => {
          each(res, (metaField: MetaFormFieldKeyValueRO) => {
            const { Code, Value } = metaField;
            const metaKey = `${META_KEY}${metaId}`;
            const convertValue = convertInitialValueBySchemaDefine(
              metaKey,
              Code,
              Value,
              renderSchema,
            );

            metaValues[`${metaKey}`][`${Code}`] = convertValue;
            form.setValueByPath(`${metaKey}.${Code}`, convertValue);
          });
        });
      });
    }
    return metaValues;
  };

  useEffect(() => {
    if (isEmpty(metaListArr) || !loadForm || isEmpty(renderSchema)) return;
    setTimeout(() => {
      // 自己赋值
      const draftId = draftDetail?.ID;
      initFormValues(metaListArr, draftId, renderSchema);
    }, 0);
  }, [metaListArr, draftDetail?.ID, loadForm, renderSchema]);

  // useEffect(() => {
  //   if (isEmpty(metaValues) || !loadForm) return;
  //   form.setValues(metaValues);
  //   // 统一赋值
  // }, [metaValues, loadForm]);

  const onMount = () => {
    setLoadForm(true);
  };

  return (
    <FormRender
      readOnly={readOnly}
      className={styles.form}
      displayType="row"
      removeHiddenData={false}
      schema={renderSchema}
      onMount={onMount}
      form={form}
      widgets={{
        formBox: FormBox,
        Link: MyLink,
        IOInvokerUpload,
        MyNumber,
        MyCheckBoxSingle,
        MySelect,
        MyCheckBoxMultiple,
      }}
    />
  );
}
