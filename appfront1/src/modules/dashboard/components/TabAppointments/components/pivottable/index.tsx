import { CopyOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons';
import { PivotTableUI } from '@imc-trading/react-pivottable';
import '@imc-trading/react-pivottable/pivottable.css';
import { Button, Modal, Popover, Space, Typography } from 'antd';
import { isEmpty, isEqual, pick } from 'lodash';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useSelector } from 'react-redux';
import { PivotConfig, PivottableProps } from './props';
import { Container } from './styles';

const Pivottable: FC<PivottableProps> = ({
    data,
    filter,
    setFilter,
    initialConfigState,
    setInitialConfigState,
    onChangeConfig,
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [preview, setPreview] = useState<{ visible: boolean; workspaceId?: string; conversationId?: string }>({
        visible: false,
    });
    const loggedUser = useSelector((state: any) => state.loginReducer?.loggedUser);
    const sanitizeConfig = useCallback(
        (config: PivotConfig): PivotConfig => {
            const rows = config.rows ?? [];
            const cols = config.cols ?? [];
            const vals = config.vals ?? [];
            const activeFields = new Set<string>([...rows, ...cols, ...vals]);
            const originalValueFilter = config.valueFilter ?? {};

            const sanitizedFilter = Object.entries(originalValueFilter).reduce<Record<string, Record<string, boolean>>>(
                (acc, [field, values]) => {
                    if (!activeFields.has(field)) {
                        return acc;
                    }

                    const truthyValues = Object.entries(values ?? {}).reduce<Record<string, boolean>>(
                        (valueAcc, [value, shouldExclude]) => {
                            if (shouldExclude) {
                                valueAcc[value] = true;
                            }
                            return valueAcc;
                        },
                        {}
                    );

                    if (Object.keys(truthyValues).length > 0) {
                        acc[field] = truthyValues;
                    }

                    return acc;
                },
                {}
            );

            if (isEqual(originalValueFilter, sanitizedFilter)) {
                return config;
            }

            return {
                ...config,
                valueFilter: sanitizedFilter,
            };
        },
        []
    );

    const filteredConfigState = useMemo(() => {
        if (!initialConfigState) return undefined;

        const cols = !isEmpty(data)
            ? initialConfigState.cols?.filter((col) => data && data[0].some((content) => content === col))
            : [];
        const rows = !isEmpty(data)
            ? initialConfigState.rows?.filter((row) => data && data[0].some((content) => content === row))
            : [];

        return sanitizeConfig({
            ...initialConfigState,
            cols,
            rows,
        });
    }, [data, initialConfigState, sanitizeConfig]);

    const handleConfigChange = useCallback(
        (config: PivotConfig) => {
            setInitialConfigState(sanitizeConfig(config));
        },
        [sanitizeConfig, setInitialConfigState]
    );

    useEffect(() => {
        try {
            const params = pick(initialConfigState, [
                'aggregatorName',
                'colOrder',
                'cols',
                'rendererName',
                'rows',
                'valueFilter',
                'vals',
                'unusedOrientationCutoff',
                'tableOptions',
                'sorters',
                'rowOrder',
                'derivedAttributes',
            ]);

            if (Object.keys(params ?? {}).length) {
                const filters = pick(filter, ['startDate', 'endDate']);
                const configBase64 = window.btoa(JSON.stringify(params));
                const filtersBase64 = window.btoa(JSON.stringify(filters ?? {}));
                const url = `/dashboard/appointments?config=${configBase64}&filters=${filtersBase64}`;
                window.history.replaceState(null, '', url);
            }
        } catch (error) {
            console.error('error on encript config state', error);
        }
    }, [initialConfigState, filter]);

    useEffect(() => {
        try {
            const search = new URLSearchParams(window.location.search);
            const configParams = search.get('config');
            const filtersParams = search.get('filters');

            if (configParams) {
                const decryptedParams = JSON.parse(window.atob(configParams));
                setInitialConfigState(sanitizeConfig(decryptedParams));
            }

            if (filtersParams) {
                const decrypt = window.atob(filtersParams);
                setFilter(JSON.parse(decrypt));
            }
        } catch (error) {
            console.error('error on decrypt url params', error);
        }
    }, [sanitizeConfig, setFilter, setInitialConfigState]);

    useEffect(() => {
        if (!initialConfigState || !onChangeConfig) return;
        onChangeConfig(initialConfigState);
    }, [initialConfigState, onChangeConfig]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const enhance = () => {
            const cells = el.querySelectorAll('td, th.pvtRowLabel, th.pvtColLabel');
            cells.forEach((cell) => {
                const htmlEl = cell as HTMLElement;
                const text = (htmlEl.textContent || '').trim();
                if (!/^https?:\/\//.test(text)) return;
                if (htmlEl.dataset.linkEnhanced === 'true' && htmlEl.querySelector('[data-conversation-actions]')) {
                    return;
                }

                const url = text;
                const mount = document.createElement('div');
                mount.dataset.conversationActions = 'true';
                htmlEl.textContent = '';
                htmlEl.appendChild(mount);
                const root = createRoot(mount);

                const CellActions: FC = () => {
                    const [open, setOpen] = useState(false);

                    const handleCopy = async (e: any) => {
                        e.stopPropagation();
                        try {
                            await navigator.clipboard.writeText(url);
                        } catch (err) {
                            window.prompt('Copiar link da conversa:', url);
                        }
                        setOpen(false);
                    };

                    const handleOpenPreview = (e: any) => {
                        e.stopPropagation();
                        try {
                            const parsed = new URL(url, window.location.origin);
                            const convId = parsed.searchParams.get('conversation') || parsed.searchParams.get('conversationId') || '';
                            const wsId = parsed.searchParams.get('workspace') || parsed.searchParams.get('workspaceId') || '';
                            if (convId && wsId) setPreview({ visible: true, conversationId: convId, workspaceId: wsId });
                        } catch (_) {
                            const mConv = url.match(/[?&](conversation|conversationId)=([^&]+)/);
                            const mWs = url.match(/[?&](workspace|workspaceId)=([^&]+)/);
                            if (mConv && mWs) setPreview({ visible: true, conversationId: decodeURIComponent(mConv[2]), workspaceId: decodeURIComponent(mWs[2]) });
                        }
                        setOpen(false);
                    };

                    const content = (
                        <Space direction='vertical' style={{ minWidth: 220 }}>
                            <Button icon={<CopyOutlined />} onClick={handleCopy} block>
                                Copiar link da conversa
                            </Button>
                            <Button icon={<EyeOutlined />} onClick={handleOpenPreview} block>
                                Visualizar conversa
                            </Button>
                        </Space>
                    );

                    return (
                        <Space size='small'>
                            <Typography.Text ellipsis style={{ maxWidth: 420 }} title={url}>
                                {url}
                            </Typography.Text>
                            <Popover open={open} onOpenChange={setOpen} trigger='click' content={content} destroyTooltipOnHide>
                                <Button size='small' icon={<MoreOutlined />} onClick={(e) => { e.stopPropagation(); setOpen((s) => !s); }} />
                            </Popover>
                        </Space>
                    );
                };

                root.render(<CellActions />);
                htmlEl.dataset.linkEnhanced = 'true';
            });
        };

        enhance();
        const observer = new MutationObserver(() => enhance());
        observer.observe(el, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, [data, filteredConfigState]);

    const iframeUrl = useMemo(() => {
        if (!preview.visible || !preview.workspaceId || !preview.conversationId || !loggedUser?._id) return '';
        return `${window.location.origin}/iframes?workspaceId=${preview.workspaceId}&conversationId=${preview.conversationId}&userId=${loggedUser._id}`;
    }, [preview, loggedUser]);

    return (
        <Container>
            <div ref={containerRef}>
                <PivotTableUI {...filteredConfigState} data={data} onChange={handleConfigChange} />
            </div>
            <Modal
                title='Visualização da conversa'
                visible={preview.visible}
                footer={null}
                width={800}
                zIndex={2100}
                destroyOnClose
                onCancel={() => setPreview({ visible: false })}
            >
                {iframeUrl && (
                    <iframe title='Live Agent' src={iframeUrl} style={{ width: '100%', height: 600, border: '1px solid #bfbfbf' }} />
                )}
            </Modal>
        </Container>
    );
};

export default Pivottable;
