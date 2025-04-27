export interface EndpointRoute {
  id: string;
  path: string;
  public?: { inherited?: boolean; value?: boolean } | boolean;
  showInDocumentation?: { inherited?: boolean; value?: boolean } | boolean;
  secreted?: { inherited?: boolean; value?: boolean } | boolean;
  acl?: { inherited?: boolean; value?: string } | string;
  backofficeAcl?: { inherited?: boolean; value?: string };
  verb: string;
  allowUnknownRequestContentType?: { inherited?: boolean; value?: boolean } | boolean;
  allowUnknownResponseContentType?: { inherited?: boolean; value?: boolean } | boolean;
  preDecorators: string[];
  postDecorators: string[];
  rateLimit?: { inherited?: boolean; value?: any };
}

export interface Endpoint {
  basePath: string;
  type: string;
  public: boolean;
  showInDocumentation: boolean;
  secreted: boolean;
  acl: string;
  service?: string;
  port?: string;
  pathRewrite?: string;
  description: string;
  tags?: string[];
  backofficeAcl: { inherited: boolean };
  allowUnknownRequestContentType: boolean;
  allowUnknownResponseContentType: boolean;
  forceMicroserviceGatewayProxy: boolean;
  listeners: { [key: string]: boolean };
  useDownstreamProtocol?: boolean;
  routes?: { [key: string]: EndpointRoute };
  pathName?: string;
  collectionId?: string;
  internalEndpoint?: string;
}

export interface CollectionField {
  name: string;
  type: string;
  required: boolean;
  nullable: boolean;
  description?: string;
  sensitivityValue?: number;
  encryptionEnabled?: boolean;
  encryptionSearchable?: boolean;
  schema?: any;
}

export interface CollectionIndex {
  name: string;
  type: string;
  unique: boolean;
  fields: { name: string; order: number }[];
}

export interface Collection {
  id: string;
  name: string;
  fields: CollectionField[];
  internalEndpoints: { basePath: string; defaultState: string }[];
  type: string;
  indexes: CollectionIndex[];
  description: string;
  tags?: string[];
  hidden?: boolean;
  owners?: { owner: string }[];
  source?: string;
  pipeline?: any[];
}

export interface ContainerPort {
  name: string;
  from: number;
  to: number;
  protocol?: string;
}

export interface ProbeConfig {
  path?: string;
  port?: string;
  initialDelaySeconds?: number;
  periodSeconds?: number;
  timeoutSeconds?: number;
  successThreshold?: number;
  failureThreshold?: number;
}

export interface Service {
  type: string;
  advanced: boolean;
  name: string;
  dockerImage: string;
  replicas: number;
  serviceAccountName: string;
  logParser: string;
  description?: string;
  environment?: { name: string; valueType: string; value: string }[];
  annotations?: { name: string; value: string; description?: string; readOnly?: boolean }[];
  labels?: { name: string; value: string; description?: string; readOnly?: boolean; isSelector?: boolean }[];
  resources?: {
    cpuLimits?: { max: string; min: string };
    memoryLimits?: { max: string; min: string };
  };
  probes?: {
    liveness?: ProbeConfig;
    readiness?: ProbeConfig;
    startup?: ProbeConfig;
  };
  tags?: string[];
  swaggerPath?: string;
  configMaps?: { name: string; mountPath: string; viewAsReadOnly?: boolean; link?: { targetSection: string } }[];
  sourceComponentId?: string;
  createdAt?: string;
  containerPorts?: ContainerPort[];
  terminationGracePeriodSeconds?: number;
  args?: string[];
  additionalContainers?: any[];
  url?: string;
  headers?: { name: string; value: string; description: string }[];
  links?: { label: string; enableIf: string; targetSection: string }[];
  mapEnvVarToMountPath?: {
    [key: string]: { type: string; envName: string };
  };
}

export interface ProjectDesign {
  endpoints: { [key: string]: Endpoint };
  collections: { [key: string]: Collection };
  groups: any[];
  secrets: { secret: string; active: boolean; clientType: string; description: string }[];
  cmsCategories: any;
  cmsSettings: { accessGroupsExpression: string };
  cmsAnalytics: any;
  cmsDashboard: any[];
  decorators: { preDecorators: any; postDecorators: any };
  services: { [key: string]: Service };
  applications: any;
  listeners: { [key: string]: { name: string; port: number; description: string; selectedByDefault: boolean } };
  apiVersions: any[];
  version: string;
  platformVersion: string;
  lastConfigFileCommitId?: string;
  lastCommitAuthor?: string;
  commitId?: string;
  committedDate?: string;
  configMaps: any;
  serviceSecrets: any;
  serviceAccounts: { [key: string]: { name: string } };
  unsecretedVariables: { name: string; environments: { [key: string]: { value: string } } }[];
  fastDataConfig: any;
  microfrontendPluginsConfig?: any;
}
