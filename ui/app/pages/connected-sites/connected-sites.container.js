import { connect } from 'react-redux'
import ConnectedSites from './connected-sites.component'
import {
  getOpenMetamaskTabsIds,
  requestAccountsPermission,
  removePermissionsFor,
  removePermittedAccount,
} from '../../store/actions'
import {
  getConnectedDomainsForSelectedAddress,
  getCurrentAccountWithSendEtherInfo,
  getOriginOfCurrentTab,
  getPermissionDomains,
  getPermittedAccountsByOrigin,
  getSelectedAddress,
} from '../../selectors'
import { CONNECT_ROUTE, DEFAULT_ROUTE } from '../../helpers/constants/routes'

const mapStateToProps = (state) => {
  const { openMetaMaskTabs } = state.appState
  const { id } = state.activeTab
  const connectedDomains = getConnectedDomainsForSelectedAddress(state)
  const originOfCurrentTab = getOriginOfCurrentTab(state)
  const permittedAccountsByOrigin = getPermittedAccountsByOrigin(state)
  const selectedAddress = getSelectedAddress(state)

  const currentTabHasNoAccounts = !permittedAccountsByOrigin[
    originOfCurrentTab
  ]?.length

  let tabToConnect
  if (originOfCurrentTab && currentTabHasNoAccounts && !openMetaMaskTabs[id]) {
    tabToConnect = {
      origin: originOfCurrentTab,
    }
  }

  return {
    accountLabel: getCurrentAccountWithSendEtherInfo(state).name,
    connectedDomains,
    domains: getPermissionDomains(state),
    permittedAccountsByOrigin,
    selectedAddress,
    tabToConnect,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    getOpenMetamaskTabsIds: () => dispatch(getOpenMetamaskTabsIds()),
    disconnectAccount: (domainKey, address) => {
      dispatch(removePermittedAccount(domainKey, address))
    },
    disconnectAllAccounts: (domainKey, domain) => {
      const permissionMethodNames = domain.permissions.map(({ parentCapability }) => parentCapability)
      dispatch(removePermissionsFor({
        [domainKey]: permissionMethodNames,
      }))
    },
    requestAccountsPermission: (origin) => dispatch(requestAccountsPermission(origin)),
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {
    connectedDomains,
    domains,
    selectedAddress,
    tabToConnect,
  } = stateProps
  const {
    disconnectAccount,
    disconnectAllAccounts,
    requestAccountsPermission: dispatchRequestAccountsPermission,
  } = dispatchProps
  const { history } = ownProps

  const closePopover = () => history.push(DEFAULT_ROUTE)

  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    closePopover,
    disconnectAccount: (domainKey) => {
      disconnectAccount(domainKey, selectedAddress)
      if (connectedDomains.length === 1) {
        closePopover()
      }
    },
    disconnectAllAccounts: (domainKey) => {
      disconnectAllAccounts(domainKey, domains[domainKey])
      if (connectedDomains.length === 1) {
        closePopover()
      }
    },
    requestAccountsPermission: async () => {
      const id = await dispatchRequestAccountsPermission(tabToConnect.origin)
      history.push(`${CONNECT_ROUTE}/${id}`)
    },
  }
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(ConnectedSites)
