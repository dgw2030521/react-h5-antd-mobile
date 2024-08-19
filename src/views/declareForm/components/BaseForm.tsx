import { ApplyPeriodType } from '@CodeDefine/customer/ApplyPeriodType';
import { AreaViewRO } from '@CodeDefine/customer/AreaViewRO';
import { CustomerPolicyDetailRO } from '@CodeDefine/customer/CustomerPolicyDetailRO';
import { PolicyApplyFormRO } from '@CodeDefine/customer/PolicyApplyFormRO';
import { Form, Input, Picker, PickerRef, Space } from 'antd-mobile';
import { filter, find, isEmpty, map } from 'lodash-es';
import moment from 'moment/moment';
import React, { RefObject, useEffect, useState } from 'react';

import { IsJsonString } from '@/views/declareForm/commonTools';
import UploadImage from '@/views/declareForm/components/Upload';
import styles from '@/views/declareForm/index.module.scss';
import useDeclareForm from '@/views/declareForm/useDeclareForm';
import FormBox from '@/views/declareForm/widgets/formBox';

interface BaseFormProps {
  bodyId: string;
  form: any;
  policyInfo: CustomerPolicyDetailRO;
  draftDetail: PolicyApplyFormRO;
}
export default function BaseForm(props: BaseFormProps) {
  const { bodyId, form, policyInfo, draftDetail } = props;
  const [cycleList, setCycleList] = useState([]);
  // 申报周期
  const [versionCode, setVersionCode] = useState([]);
  const [areaId, setAreaId] = useState([]);
  const [city, setCity] = useState([]);
  const [street, setStreet] = useState([]);
  // 营业执照
  const [attachProof, setAttachProof] = useState(null);

  const {
    areaList,
    getAreaDict,
    getLatestApplyTargetInfo,
    getApplyVersionCodeRange,
  } = useDeclareForm();

  /**
   * 获取申报信息,AttachProof, AreaId, StreetAreaId, CityAreaId
   * @param bodyId
   */
  const getApplyTargetInfo = async (bodyId: string) => {
    const { AttachProof, AreaId, StreetAreaId, CityAreaId } =
      await getLatestApplyTargetInfo();
    setAreaId([AreaId]);
    setCity([CityAreaId]);
    setStreet([StreetAreaId]);
    setAttachProof(AttachProof);
  };

  const LoginScriptValue = JSON.parse(
    localStorage.getItem('LoginScriptValue') || null,
  );

  const getVersionCode = async (draftId: string) => {
    const period = policyInfo.ApplyPeriod;
    const leftDate = policyInfo.CreateTime;
    const leftCount = 3;
    const rightDate = moment().format('YYYY-MM-DD HH:mm:ss');
    const rightCount = 3;

    const resultCircle = await getApplyVersionCodeRange(
      period,
      leftDate,
      leftCount,
      rightDate,
      rightCount,
    );
    if (policyInfo.ApplyPeriod._value === ApplyPeriodType.ONCE.Value) {
      setCycleList([]);
    } else {
      const currentDateIndex = resultCircle.length - rightCount - 1;
      if (draftId === '0') {
        setVersionCode([resultCircle[currentDateIndex]]);
      } else {
        setVersionCode([draftDetail.VersionCode]);
      }

      setCycleList(
        map(resultCircle, item => {
          return { label: item, value: item };
        }),
      );
    }
  };

  const initBaseForm = async ($bodyId: string) => {
    // 区域信息
    await getAreaDict();

    // 企业账号;个人账号，不需要走获取营业执照
    if (LoginScriptValue?.LoginType === 1) {
      await getApplyTargetInfo($bodyId);
    }
  };

  useEffect(() => {
    initBaseForm(bodyId);
  }, [bodyId]);

  useEffect(() => {
    if (isEmpty(draftDetail)) return;

    const draftId = draftDetail?.ID;

    getVersionCode(draftId);
    if (
      draftId !== '0' &&
      draftDetail?.AttachProof &&
      IsJsonString(draftDetail?.AttachProof)
    ) {
      // 设置营业执照,ApplyTargetInfo已有
      setAttachProof(draftDetail?.AttachProof);
    }
  }, [draftDetail]);

  useEffect(() => {
    if (city) {
      form.setFieldValue('City', city);
    }
    if (areaId) {
      form.setFieldValue('AreaID', areaId);
    }
    if (street) {
      form.setFieldValue('Street', street);
    }
    if (versionCode) {
      form.setFieldValue('versionCode', versionCode);
    }
    if (attachProof) {
      form.setFieldValue('AttachProof', attachProof);
    }
    //   单选，监测第一个
  }, [areaId?.[0], city?.[0], street?.[0], attachProof, versionCode?.[0]]);

  const [cityRenderList, setCityRenderList] = useState([]);
  const [areaRenderList, setAreaRenderList] = useState([]);
  const [streetRenderList, setStreetRenderList] = useState([]);

  const changePickerData = (list: AreaViewRO[]) => {
    return map(list, item => {
      return {
        label: item.Name,
        value: item.ID,
        type: item.Type,
        parentId: item.Parent.ID,
      };
    });
  };
  /**
   * 初始化对应的区域块
   *  public static readonly NONE = new ViEnum(0, "无", "", "NONE");
   *  public static readonly PROVINCE = new ViEnum(1, "省级", "", "PROVINCE");
   *  public static readonly CITY = new ViEnum(2, "市级", "", "CITY");
   *  public static readonly AREA = new ViEnum(3, "区县级", "", "AREA");
   *  public static readonly STREET = new ViEnum(4, "街道级", "", "STREET");
   *  public static readonly COMMUNITY = new ViEnum(5, "社区级", "", "COMMUNITY");
   * @param matchedArea
   */
  const initFieldItem = (matchedArea: AreaViewRO) => {
    if (matchedArea.Type._value === 2) {
      form.setFieldsValue({
        City: [matchedArea.ID],
      });
      setCity([matchedArea.ID]);
    }
    if (matchedArea.Type._value === 3) {
      form.setFieldsValue({
        AreaID: [matchedArea.ID],
      });
      setAreaId([matchedArea.ID]);
    }
    if (matchedArea.Type._value === 4) {
      form.setFieldsValue({
        Street: [matchedArea.ID],
      });
      setStreet([matchedArea.ID]);
    }
  };

  useEffect(() => {
    if (isEmpty(areaList) || isEmpty(policyInfo)) return;
    const currentArea = find(areaList, item => item.ID === policyInfo?.Area);
    initFieldItem(currentArea);
    // 市
    const cityRenderList = filter(areaList, item => {
      return item.Type._value === 2;
    });
    setCityRenderList(cityRenderList);
    // 区县
    const areaRenderList = filter(areaList, item => {
      return item.Type._value === 3 && item.Parent.ID === city?.[0];
    });
    setAreaRenderList(areaRenderList);
    // 街道
    const streetRenderList = filter(areaList, item => {
      return item.Type._value === 4 && item.Parent.ID === areaId?.[0];
    });
    setStreetRenderList(streetRenderList);
  }, [policyInfo, areaList, city?.[0], areaId?.[0]]);

  return (
    <Form
      layout="horizontal"
      className={styles.form}
      form={form}
      // disabled
    >
      {!isEmpty(cycleList) && (
        <div className={styles.card_single}>
          <Form.Item
            className={styles.formItem}
            label="申报周期"
            name="versionCode"
            trigger="onConfirm"
            onClick={(e, pickerRef: RefObject<PickerRef>) => {
              pickerRef.current?.open();
            }}
            rules={[
              {
                required: true,
                message: '请选择申报周期',
              },
            ]}
          >
            <Picker columns={[cycleList]}>
              {items => {
                return (
                  <div className={styles.picker}>
                    {items.map((item, index) => (
                      <span key={index}>{item.label}</span>
                    ))}
                  </div>
                );
              }}
            </Picker>
          </Form.Item>
        </div>
      )}

      <FormBox title="申报对象情况" expand>
        {policyInfo?.ApplySource?._value === 2 ? (
          <Form.Item
            name="CompanyName"
            label={<div className={styles.label}>申报企业名称</div>}
            rules={[{ required: true, message: '必填项' }]}
            initialValue={LoginScriptValue?.CompanyName}
          >
            <Input disabled placeholder="请输入" />
          </Form.Item>
        ) : null}
        <Form.Item
          name="IdCard"
          label={
            <div className={styles.label}>
              {policyInfo?.ApplySource?._value === 2
                ? '申报企业统一社会信用代码'
                : '申报人身份证号'}
            </div>
          }
          rules={[{ required: true, message: '必填项' }]}
          initialValue={
            policyInfo?.ApplySource?._value === 2
              ? LoginScriptValue?.CreditCode
              : LoginScriptValue?.IdCard
          }
        >
          <Input disabled placeholder="请输入" />
        </Form.Item>

        <Form.Item
          name="Name"
          label={<div className={styles.label}>申报人姓名</div>}
          rules={[{ required: true, message: '必填项' }]}
          initialValue={
            policyInfo?.ApplySource?._value === 2
              ? LoginScriptValue?.CompanyManagerName
              : LoginScriptValue?.Name
          }
        >
          <Input disabled placeholder="请输入" />
        </Form.Item>

        <Form.Item
          name="Phone"
          label={<div className={styles.label}>申报人手机号</div>}
          rules={[{ required: true, message: '必填项' }]}
          initialValue={
            policyInfo?.ApplySource?._value === 2
              ? LoginScriptValue?.CompanyManagerPhone
              : LoginScriptValue?.Phone
          }
        >
          <Input disabled placeholder="请输入" />
        </Form.Item>

        <Form.Item
          className={styles.formItem}
          name="City"
          label={<div className={styles.label}>所属市级</div>}
          rules={[
            {
              required: policyInfo?.AreaType?._value === 2,
              message: '请选择所属市级',
            },
          ]}
          trigger="onConfirm"
          onClick={(e, pickerRef: RefObject<PickerRef>) => {
            pickerRef.current?.open();
          }}
        >
          <Picker
            columns={[changePickerData(cityRenderList)]}
            onConfirm={val => {
              setCity(val);
              form.setFieldsValue({
                AreaID: [],
                Street: [],
              });
            }}
          >
            {items => {
              return (
                <Space align="center">
                  {items.every(item => item === null) ? (
                    <span className={styles.placeholder}>请选择</span>
                  ) : (
                    items.map(item => item?.label ?? '未选择').join(' - ')
                  )}
                </Space>
              );
            }}
          </Picker>
        </Form.Item>

        <Form.Item
          className={styles.formItem}
          name="AreaID"
          label={<div className={styles.label}>所属区县</div>}
          rules={[
            {
              required: policyInfo?.AreaType?._value === 3,
              message: '请选择所属区县',
            },
          ]}
          trigger="onConfirm"
          onClick={(e, pickerRef: RefObject<PickerRef>) => {
            pickerRef.current?.open();
          }}
        >
          <Picker
            onConfirm={val => {
              console.log('@@@@area', val);
              setAreaId(val);
              form.setFieldsValue({
                Street: [],
              });
            }}
            columns={[changePickerData(areaRenderList)]}
          >
            {items => {
              return (
                <Space align="center">
                  {items.every(item => item === null) ? (
                    <span className={styles.placeholder}>请选择</span>
                  ) : (
                    items.map(item => item?.label ?? '未选择').join(' - ')
                  )}
                </Space>
              );
            }}
          </Picker>
        </Form.Item>

        <Form.Item
          className={styles.formItem}
          name="Street"
          label={<div className={styles.label}>所属街道/园区</div>}
          rules={[
            {
              required: policyInfo?.AreaType?._value === 4,
              message: '请选择所所属街道',
            },
          ]}
          trigger="onConfirm"
          onClick={(e, pickerRef: RefObject<PickerRef>) => {
            pickerRef.current?.open();
          }}
        >
          <Picker
            columns={[changePickerData(streetRenderList)]}
            onConfirm={val => {
              setStreet(val);
            }}
          >
            {items => {
              return (
                <Space align="center">
                  {items.every(item => item === null) ? (
                    <span className={styles.placeholder}>请选择</span>
                  ) : (
                    items.map(item => item?.label ?? '未选择').join(' - ')
                  )}
                </Space>
              );
            }}
          </Picker>
        </Form.Item>

        <Form.Item
          name="AttachProof"
          label={<div className={styles.label}>营业执照</div>}
        >
          <UploadImage
            maxCount={5}
            fileSize={5}
            memo="若营业执照内容有变更，请在此重新上传；支持扩展名：pdf、jepg、jpg、png，单文件5M内大小"
          />
        </Form.Item>
      </FormBox>
    </Form>
  );
}
