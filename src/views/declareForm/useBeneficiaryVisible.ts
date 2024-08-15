import { useRef } from 'react';
import { CustomerPolicyDetailRO } from '@CodeDefine/customer/CustomerPolicyDetailRO';
import { CashType } from '@CodeDefine/customer/CashType';
import { ApplySourceType } from '@CodeDefine/customer/ApplySourceType';
import { BenefitType } from '@CodeDefine/customer/BenefitType';

/**
 * 是否显示受益人相关信息
 * 在详情、回退、编辑页面使用
 */
export const useBeneficiaryVisible = (baseInfo: CustomerPolicyDetailRO) => {
  const beneficiaryVisibleRef = useRef<any>({});

  /** 是否无需支付 */
  const isNoCash =
    baseInfo?.CashType._value === CashType.NONE.Value ||
    baseInfo?.CashType._value === CashType.NO_DECLARE.Value;
  /** 是否为企业带个人的政策 */
  const isCompanyWithPerson =
    baseInfo?.ApplySource._value === ApplySourceType.COMPANY.Value &&
    baseInfo?.BenefitType._value === BenefitType.PERSON.Value;
  /** 当无需支付且不是企业带个人，就隐藏受益人对象 */
  const hiddenBeneficiary = isNoCash && !isCompanyWithPerson;
  console.log('hiddenBeneficiary: ', hiddenBeneficiary);

  beneficiaryVisibleRef.current.isNoCash = isNoCash;
  beneficiaryVisibleRef.current.isCompanyWithPerson = isCompanyWithPerson;
  beneficiaryVisibleRef.current.hiddenBeneficiary = hiddenBeneficiary;

  return {
    isNoCash,
    isCompanyWithPerson,
    hiddenBeneficiary,
    beneficiaryVisibleRef,
  };
};
