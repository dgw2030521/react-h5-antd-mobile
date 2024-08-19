/**
 * 申报校验
 * PolicyApplyFormInvoker.applyCheck
 *
 * 获取政策的申报按钮信息
 * PolicyInvoker.getApplyButton
 *
 * 获取当前用户最近提交的表单中的申报对象信息
 * PolicyApplyFormInvoker.getLatestApplyTargetInfo
 *
 * 申报配置--承诺函配置-查询
 * PolicyConfigInvoker.getApplyPromise
 *
 * 查询政策详情配置
 * PolicyInvoker.queryPolicyDetailConfigByBodyId
 *
 * 草稿详情
 * PolicyApplyDraftInvoker.draftDetail
 *
 * 退回修改查询已填信息
 * PolicyApplyFormInvokerEx.detail
 *
 * 页面表单
 * PolicyConfigInvoker.getMeta
 *
 * 表单详情和初始化信息
 * PolicyApplyDraftInvoker.draftMetaDetailByMetaID
 *
 * 表单自动填充的值
 * PolicyMetaFormValueInvoker.getApplyInfo
 *
 * 财务信息列表
 * CompanyBankInvoker.getBankList
 *
 * 申报周期列表
 * PolicyInvoker.getApplyVersionCodeRange
 *
 * 营业执照
 * PolicyApplyFormInvoker.getLatestApplyTargetInfo
 *
 * 所属市、所属区县、所属街道/园区,根据Type字段筛选
 * DictAreaInvoker.display
 */
import { ApplyPeriodType } from '@CodeDefine/customer/ApplyPeriodType';
import { AppType } from '@CodeDefine/customer/AppType';
import { AreaDisplayConditionVO } from '@CodeDefine/customer/AreaDisplayConditionVO';
import { AreaViewRO } from '@CodeDefine/customer/AreaViewRO';
import { CustomerPolicyDetailRO } from '@CodeDefine/customer/CustomerPolicyDetailRO';
import { CompanyBankInvoker } from '@CodeDefine/customer/Invoker/CompanyBankInvoker';
import { DictAreaInvoker } from '@CodeDefine/customer/Invoker/DictAreaInvoker';
import { DictPolicyTypeInvoker } from '@CodeDefine/customer/Invoker/DictPolicyTypeInvoker';
import { PersonBankInvoker } from '@CodeDefine/customer/Invoker/PersonBankInvoker';
import { PolicyApplyDraftInvoker } from '@CodeDefine/customer/Invoker/PolicyApplyDraftInvoker';
import { PolicyApplyFormInvoker } from '@CodeDefine/customer/Invoker/PolicyApplyFormInvoker';
import { PolicyConfigInvoker } from '@CodeDefine/customer/Invoker/PolicyConfigInvoker';
import { PolicyInvoker } from '@CodeDefine/customer/Invoker/PolicyInvoker';
import { PolicyMetaFormValueInvoker } from '@CodeDefine/customer/Invoker/PolicyMetaFormValueInvoker';
import { PolicyApplyFormRO } from '@CodeDefine/customer/PolicyApplyFormRO';
import { PolicyApplyPromiseRO } from '@CodeDefine/customer/PolicyApplyPromiseRO';
import { PolicyStatus } from '@CodeDefine/customer/PolicyStatus';
import { PolicyTypeDisplayConditionVO } from '@CodeDefine/customer/PolicyTypeDisplayConditionVO';
import { PolicyTypeViewRO } from '@CodeDefine/customer/PolicyTypeViewRO';
import { ViEnum32 } from '@ViCross/ViEnum32';
import { useState } from 'react';

export default function useDeclareForm() {
  const [policyInfo, setPolicyInfo] = useState<CustomerPolicyDetailRO>(null);
  const [draftDetail, setDraftDetail] = useState<PolicyApplyFormRO>(null);
  const [allPolicyTypes, setAllPolicyTypes] = useState<PolicyTypeViewRO[]>();
  const [areaList, setAreaList] = useState<AreaViewRO[]>();
  const [promiseList, setPromiseList] = useState<PolicyApplyPromiseRO[]>([]);
  /**
   * 查询区域信息
   */
  const getAreaDict = async () => {
    const payload = new AreaDisplayConditionVO();
    const { result, code } = await DictAreaInvoker.display(1, 20, payload);
    if (code.Code === 200) {
      const _data = result.Value?.filter(item => item.Active).map(i => ({
        ...i,
        label: i.Name,
      }));

      setAreaList(_data);
      return _data;
    }
  };

  /**
   * 查询申报单详情,返回修改的时候调用这个接口
   * @param id
   */
  const getApplyFormDetail = async (id: string) => {
    const { code, result } = await PolicyApplyFormInvoker.detail(id);
    if (code.Code !== 200) {
      throw new Error(code.Message);
    }
    return result;
  };
  /**
   * 获取当前页面表单
   * @param bodyId
   * @param appType
   */
  const getPolicyConfigMeta = async (
    bodyId: string,
    appType: ViEnum32<AppType> = new ViEnum32<AppType>(AppType.CUSTOMER.Value),
  ) => {
    // const appType = new ViEnum32<AppType>(AppType.CUSTOMER.Value);
    const { code, result } = await PolicyConfigInvoker.getMeta(bodyId, appType);
    if (code.Code !== 200) {
      throw new Error(code.Message);
    }
    return result;
  };

  /**
   * 动态表单元数据获取初始值
   * @param draftFormID 调用draftDetail接口拿到的最新的草稿id
   * @param metaID
   */
  const getDraftMetaDetailByMetaID = async (
    draftFormID: string,
    metaID: string,
  ) => {
    const { code, result } =
      await PolicyApplyDraftInvoker.draftMetaDetailByMetaID(
        draftFormID,
        metaID,
      );
    if (code.Code !== 200) {
      throw new Error(code.Message);
    }
    return result;
  };

  /**
   * 获取表单自动填充的值，非草稿请求
   * @param metaId 传入的metaId
   * @param draftId 默认为0，没有获取到元数据草稿时候，传入0，有数据草稿使用getDraftMetaDetailByMetaID
   *
   * @example
   * const allApplyInfoRequest = metaIds?.map(item => {
   *             return CustomerMessage.PolicyMetaFormValueInvoker.getApplyInfo(
   *               item,
   *               '0',
   *             );
   *      });
   */
  const getApplyInfo = async (metaId: string, draftId: string = '0') => {
    const { code, result } = await PolicyMetaFormValueInvoker.getApplyInfo(
      metaId,
      draftId,
    );
    if (code.Code !== 200) {
      throw new Error(code.Message);
    }
    return result;
  };

  /**
   * 获取申报对象:包含营业执照
   */
  const getLatestApplyTargetInfo = async () => {
    const { code, result } =
      await PolicyApplyFormInvoker.getLatestApplyTargetInfo();
    if (code.Code !== 200) {
      throw new Error(code.Message);
    }
    return result;
  };

  /**
   * 查询政策详情配置
   * @param policyBodyId
   */
  const getPolicyInfo = async (policyBodyId: string) => {
    const { code, result } =
      await PolicyInvoker.queryPolicyDetailConfigByBodyId(policyBodyId);
    if (code.Code !== 200) {
      throw new Error(code.Message);
    }
    setPolicyInfo(result);
    return result;
  };

  const getAllPolicyType = async () => {
    const payload = new PolicyTypeDisplayConditionVO();
    const { code, result } = await DictPolicyTypeInvoker.display(
      1,
      9999,
      payload,
    );
    if (code.Code !== 200) {
      throw new Error(code.Message);
    }
    setAllPolicyTypes(result.Value);
    return result;
  };

  /**
   * 获得申请批次编号列表、申报周期列表
   *
   * @param period 周期
   * @param leftDate 左日期 (nullable)
   * @param leftCount 左数量
   * @param rightDate 右日期 (nullable)
   * @param rightCount 右数量
   */
  const getApplyVersionCodeRange = async (
    period: ViEnum32<ApplyPeriodType>,
    leftDate: string,
    leftCount: number,
    rightDate: string,
    rightCount: number,
  ) => {
    // const period = new ViEnum32(ApplyPeriodType.MONTH.Value);
    const { code, result } = await PolicyInvoker.getApplyVersionCodeRange(
      period,
      leftDate,
      leftCount,
      rightDate,
      rightCount,
    );
    if (code.Code !== 200) {
      throw new Error(code.Message);
    }
    return result;
  };

  /**
   * 获取草稿，草稿初始化的值不多，申报对象用另一个接口初始化了4个字段，这个值获取几个重要信息，用来接下来的
   * metaId获取初始数据，
   * 1、draftid meta查询初始值需要
   * 2、versioncode 申报周期初始值
   * 3、attachProof 营业执照初始值,一开始用了申报对象的，这里还是用草稿的，-1的时候获取的和getLatest是一样的
   *
   * draftId – 为-1时查询已有最新一个草稿
   * policyID – 政策ID
   *
   * @param policyId
   * @param draftId
   */
  const getDraftDetail = async (policyId: string, draftId: string) => {
    // url上获取草稿id，有值或者-1
    const { code, result } = await PolicyApplyDraftInvoker.draftDetail(
      draftId,
      policyId,
    );
    // if (code.Code === 200) {
    //   return {
    //     draftid: result.ID,
    //     versioncode: result.VersionCode,
    //     attachProof: result.AttachProof,
    //   };
    // } else {
    //   return { draftid: '0' };
    // }

    // 不报错，返回一个ID='0'的新值
    if (code.Code !== 200) {
      // throw new Error(code.Message);
      const newResult = new PolicyApplyFormRO();
      newResult.ID = '0';

      setDraftDetail(newResult);

      return newResult;
    }
    setDraftDetail(result);
    // 获取的值，要么有值，要么为'0'
    return result;
  };

  /**
   * 申报配置--承诺函配置-查询
   * @param bodyId
   */
  const getApplyPromise = async (bodyId: string) => {
    const { code, result } = await PolicyConfigInvoker.getApplyPromise(bodyId);
    if (code.Code !== 200) {
      throw new Error(code.Message);
    }
    setPromiseList(result);
    return result;
  };

  const getPersonBank = async () => {
    const { code, result } = await PersonBankInvoker.getBankList({});
    if (code.Code !== 200) {
      throw new Error(code.Message);
    }
    const ids = [];
    const names = [];
    result.forEach(item => {
      ids.push(item.ID);
      names.push(`${item.BankName}/${item.BankNumber}`);
    });

    return { ids, names };
  };

  const getCompanyBank = async () => {
    const { code, result } = await CompanyBankInvoker.getBankList({});
    if (code.Code !== 200) {
      throw new Error(code.Message);
    }

    const ids = [];
    const names = [];
    result.forEach(item => {
      ids.push(item.ID);
      names.push(`${item.BankName}/${item.SubBankName}/${item.BankNumber}`);
    });
    return { ids, names };
  };

  // 政策状态
  const policyStatusName = PolicyStatus.ValueList.find(
    i => i.Value === policyInfo?.PolicyStatus._value,
  )?.Name;

  // 政策类型
  const policyTypeNames = policyInfo?.Type?.map(
    i => allPolicyTypes?.find(j => j.ID === i)?.Name,
  )?.slice(0, 3);

  return {
    getPolicyConfigMeta,
    getDraftMetaDetailByMetaID,
    getApplyInfo,
    getApplyVersionCodeRange,
    getLatestApplyTargetInfo,
    getApplyFormDetail,
    getDraftDetail,
    getAllPolicyType,
    getPolicyInfo,
    getApplyPromise,
    getAreaDict,

    getCompanyBank,
    getPersonBank,

    promiseList,
    areaList,
    policyInfo,
    setPolicyInfo,
    draftDetail,
    setDraftDetail,

    allPolicyTypes,
    policyStatusName,
    policyTypeNames,
  };
}
