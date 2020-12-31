import h from 'mithril/hyperscript'
import * as helper from '../helper'
import { dropShadowHeader, backButton } from '../shared/common'
import Checkbox from '../shared/form/Checkbox'
import layout from '../layout'
import settings from '../../settings'

interface State {
  onChange: (v: boolean) => void
}

export default {
  oncreate: helper.viewSlideIn,

  oninit() {
    this.onChange = () => {
      // TODO check and download eval file
    }
  },

  view() {
    const header = dropShadowHeader(null, backButton('Stockfish'))
    return layout.free(header, renderBody(this))
  }
} as Mithril.Component<{}, State>

function renderBody(ctrl: State) {
  return h('ul.native_scroller.page.settings_list.game', [
    h('li.list_item', [
      h(Checkbox, {
        label: 'Use NNUE',
        name: 'nnue',
        prop: settings.stockfish.useNNUE,
        callback: ctrl.onChange,
      }),
    ]),
  ])
}
