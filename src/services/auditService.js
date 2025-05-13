import axios from 'axios';

/**
 * 获取审计日志
 * @param {Object} params - 查询参数 
 * @param {Number} params.page - 页码
 * @param {Number} params.per_page - 每页记录数
 * @param {String} params.action - 动作类型过滤
 * @param {String} params.from_date - 起始日期
 * @param {String} params.to_date - 结束日期
 * @param {Number} params.user_id - 用户ID过滤
 * @param {String} params.user_role - 用户角色过滤
 * @returns {Promise} 查询结果
 */
export const getAuditLogs = async (params = {}) => {
  try {
    const response = await axios.get('/api/admin/audit-logs', { 
      params,
      withCredentials: true // 确保包含认证cookie
    });
    
    // 将时间戳转换为本地时间
    if (response.data.success && response.data.logs) {
      response.data.logs = response.data.logs.map(log => ({
        ...log,
        timestamp: convertToLocalTime(log.timestamp),
        originalTimestamp: log.timestamp // 保留原始时间戳
      }));
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

/**
 * 导出审计日志为PDF
 * @param {Object} params - 查询参数（同getAuditLogs）
 * @returns {Promise} 导出结果
 */
export const exportAuditLogsToPDF = async (params = {}) => {
  try {
    const response = await axios.get('/api/admin/export-audit-logs/pdf', { 
      params,
      withCredentials: true
    });
    
    // 将时间戳转换为本地时间
    if (response.data.success && response.data.logs) {
      response.data.logs = response.data.logs.map(log => ({
        ...log,
        timestamp: convertToLocalTime(log.timestamp),
        originalTimestamp: log.timestamp // 保留原始时间戳
      }));
    }
    
    return response.data;
  } catch (error) {
    console.error('Error exporting audit logs to PDF:', error);
    throw error;
  }
};

/**
 * 导出审计日志为CSV
 * @param {Object} params - 查询参数（同getAuditLogs）
 * @returns {Promise} 导出结果
 */
export const exportAuditLogsToCSV = async (params = {}) => {
  try {
    const response = await axios.get('/api/admin/export-audit-logs/csv', { 
      params,
      withCredentials: true
    });
    
    // 将时间戳转换为本地时间
    if (response.data.success && response.data.logs) {
      response.data.logs = response.data.logs.map(log => ({
        ...log,
        timestamp: convertToLocalTime(log.timestamp),
        originalTimestamp: log.timestamp // 保留原始时间戳
      }));
    }
    
    return response.data;
  } catch (error) {
    console.error('Error exporting audit logs to CSV:', error);
    throw error;
  }
};

/**
 * 将审计动作格式化为可读文本
 * @param {String} action - 审计动作
 * @returns {String} 格式化后的文本
 */
export const formatAction = (action) => {
  const actionMap = {
    'login': 'User Login',
    'logout': 'User Logout',
    'FORM_SUBMIT': 'Form Submission',
    'DRAFT_SAVE': 'Draft Saved',
    'DRAFT_UPDATE': 'Draft Updated',
    'VIEW_FORMS': 'Forms Viewed',
    'view_audit_logs': 'Audit Logs Viewed',
    'view_users': 'Users List Viewed',
    'update_user': 'User Updated',
    'export_audit_logs': 'Audit Logs Exported'
  };
  
  return actionMap[action] || action;
};

/**
 * 获取审计动作的样式类
 * @param {String} action - 审计动作
 * @returns {String} CSS类名
 */
export const getActionClass = (action) => {
  const classMap = {
    'login': 'action-login',
    'logout': 'action-logout',
    'FORM_SUBMIT': 'action-submit',
    'DRAFT_SAVE': 'action-draft',
    'DRAFT_UPDATE': 'action-draft',
    'VIEW_FORMS': 'action-view',
    'view_audit_logs': 'action-admin',
    'view_users': 'action-admin',
    'update_user': 'action-admin',
    'export_audit_logs': 'action-admin'
  };
  
  return classMap[action] || '';
};

/**
 * 将UTC时间字符串转换为本地时间
 * @param {String} utcTimeString - UTC时间字符串 "YYYY-MM-DD HH:MM:SS" 格式
 * @returns {String} 本地时间字符串
 */
export const convertToLocalTime = (utcTimeString) => {
  if (!utcTimeString) return '';
  
  try {
    // 解析UTC时间字符串并添加Z表示这是UTC时间
    // 将 "YYYY-MM-DD HH:MM:SS" 转换为 "YYYY-MM-DDTHH:MM:SSZ" 格式
    const utcTime = utcTimeString.replace(' ', 'T') + 'Z';
    const date = new Date(utcTime);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.error('Invalid date format:', utcTimeString);
      return utcTimeString; // 返回原始字符串
    }
    
    // 转换为本地时间并返回格式化后的字符串
    return date.toLocaleString();
  } catch (error) {
    console.error('Error converting UTC to local time:', error);
    return utcTimeString; // 出错时返回原始字符串
  }
};

/**
 * 将本地时间转换为UTC时间字符串
 * @param {Date|String} localDate - 本地日期对象或字符串
 * @returns {String} UTC时间字符串 "YYYY-MM-DD HH:MM:SS" 格式
 */
export const convertToUTCTime = (localDate) => {
  if (!localDate) return '';
  
  try {
    const date = localDate instanceof Date ? localDate : new Date(localDate);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', localDate);
      return typeof localDate === 'string' ? localDate : '';
    }
    
    // 转换为UTC格式的字符串
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error converting local to UTC time:', error);
    return typeof localDate === 'string' ? localDate : '';
  }
};

export default {
  getAuditLogs,
  exportAuditLogsToPDF,
  exportAuditLogsToCSV,
  formatAction,
  getActionClass,
  convertToLocalTime,
  convertToUTCTime
}; 