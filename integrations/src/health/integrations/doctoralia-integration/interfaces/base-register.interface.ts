interface InsuranceResponse {
  insurance_title: string;
  insuranceid: string;
  legacyid: string;
  ex_legacyid: string;
  legacyTitle: string;
  isHiddenResource: string;
  tags: string;
}

interface TypologiesResponse {
  typologyTitle: string;
  typologyid: string;
  legacyid: string;
}

interface ActivitiesResponse {
  activityid: string;
  activityTitle: string;
  duration: string;
  price: string;
  typologyid: string;
  preparation: string;
  typologyTitle: string;
  user_min_age: string;
  user_max_age: string;
  mopBookability?: number;
}

interface AreasResponse {
  areaid: string;
  areaTitle: string;
  address: string;
}

interface ResourcesResponse {
  resourceid: string;
  resourceName: string;
}

export { InsuranceResponse, TypologiesResponse, ActivitiesResponse, AreasResponse, ResourcesResponse };
