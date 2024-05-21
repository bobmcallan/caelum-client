import * as ENV from '@t3b/app.config';

import { newlogger } from './vue-logger';

const logger = newlogger({ name: "vue-element", level: (ENV.DEBUG) ? ENV.LOGLEVEL : 'warn' });
logger.debug('Loading..');

import '@t3b/styles/index.scss'

import {
    ElAlert,
    ElAside,
    ElAutocomplete,
    ElAvatar,
    ElBacktop,
    ElBadge,
    ElBreadcrumb,
    ElBreadcrumbItem,
    ElButton,
    ElButtonGroup,
    ElCalendar,
    ElCard,
    ElCarousel,
    ElCarouselItem,
    ElCascader,
    ElCascaderPanel,
    ElCheckbox,
    ElCheckboxButton,
    ElCheckboxGroup,
    ElCol,
    ElCollapse,
    ElCollapseItem,
    ElCollapseTransition,
    ElColorPicker,
    ElContainer,
    ElDatePicker,
    ElDescriptions,
    ElDescriptionsItem,
    ElDialog,
    ElDivider,
    ElDrawer,
    ElDropdown,
    ElDropdownItem,
    ElDropdownMenu,
    ElFooter,
    ElForm,
    ElFormItem,
    ElHeader,
    ElIcon,
    ElImage,
    ElInput,
    ElInputNumber,
    ElLink,
    ElMain,
    ElMenu,
    ElMenuItem,
    ElMenuItemGroup,
    ElOption,
    ElOptionGroup,
    ElPageHeader,
    ElPagination,
    ElPopconfirm,
    ElPopover,
    ElPopper,
    ElProgress,
    ElRadio,
    ElRadioButton,
    ElRadioGroup,
    ElRate,
    ElRow,
    ElScrollbar,
    ElSelect,
    ElSlider,
    ElSpace,
    ElStep,
    ElSteps,
    ElSubMenu,
    ElSwitch,
    ElTabPane,
    ElTable,
    ElTableV2,
    ElTableColumn,
    ElTabs,
    ElTag,
    ElTimePicker,
    ElTimeSelect,
    ElTimeline,
    ElTimelineItem,
    ElTooltip,
    ElTransfer,
    ElTree,
    ElUpload,
    ElInfiniteScroll,
    ElLoading,
    ElMessage,
    ElMessageBox,
    ElNotification,
    ElStatistic
} from 'element-plus';

import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const components = [
    ElAside,
    ElBadge,
    ElButton,
    ElButtonGroup,
    ElBreadcrumb,
    ElBreadcrumbItem,
    ElDatePicker,
    ElDescriptions,
    ElDescriptionsItem,
    ElInput,
    ElInputNumber,
    ElCard,
    ElCheckbox,
    ElCheckboxButton,
    ElCheckboxGroup,
    ElCol,
    ElContainer,
    ElDivider,
    ElForm,
    ElFormItem,
    ElIcon,
    ElMain,
    ElMenu,
    ElMenuItem,
    ElMenuItemGroup,
    ElOption,
    ElOptionGroup,
    ElPageHeader,
    ElPagination,
    ElPopconfirm,
    ElPopover,
    ElPopper,
    ElRate,
    ElRow,
    ElSelect,
    ElScrollbar,
    ElSpace,
    ElSubMenu,
    ElTable,
    ElTableV2,
    ElTableColumn,
    ElTabs,
    ElTag,
    ElTabPane,
    ElTimeline,
    ElTimelineItem,
    ElTooltip,
    ElUpload,
    ElStatistic
]

const plugins = [
    ElLoading,
    ElMessage,
    ElMessageBox,
    ElNotification
]

export default {
    install: (app) => {
        const logger = newlogger({ name: "Element", level: ENV.LOGLEVEL });
        // const logger = newlogger({ name: "Element", level: "debug" });

        if (!app) throw 'app not defined'

        app.config.globalProperties.$ELEMENT = { size: 'small' }

        /*
        components.forEach(component => {
            logger.debug('Installing Element+ Component -> %s', component.name);
            app.component(component.name, component)
        })
        */

        for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
            app.component(key, component)
        }

        plugins.forEach(plugin => {
            app.use(plugin)
        })

        logger.debug('ElementPlus Installed');
    }
};