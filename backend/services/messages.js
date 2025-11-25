import i18n from './i18n.js';

class MessageService {
  getMessage(key, params = {}) {
    return i18n.t(key, params);
  }

  getCommonMessage(type, params = {}) {
    const messages = {
      'connectionError': 'messages.connectionError',
      'userNotFound': 'messages.userNotFound',
      'loading': 'common.loading',
      'invalidCode': '2fa.invalidCode',
      'verificationSuccess': '2fa.verificationSuccess',
      'dataExported': 'gdpr.dataExported',
      'dataAnonymized': 'gdpr.dataAnonymized',
      'accountDeleted': 'gdpr.accountDeleted'
    };

    return this.getMessage(messages[type] || type, params);
  }
}

export default new MessageService();
