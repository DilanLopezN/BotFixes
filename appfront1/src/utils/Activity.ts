import * as showdown from 'showdown';
import ReactHtmlParser from 'react-html-parser';
import { Activity } from '../modules/liveAgent/interfaces/activity.interface';
import * as sanitize from 'sanitize-html';
const converter = new showdown.Converter();

export const activityIsCard = (activity: Activity): boolean => {
    return (
        !!activity &&
        !!activity.attachments &&
        !!activity.attachments.length &&
        activity.attachments[0].contentType === 'application/vnd.microsoft.card.hero'
    );
};

export const parseMarkDown = (text: string) => {
    return ReactHtmlParser(converter.makeHtml(text));
};

export const formattingWhatsappText = (text: string) => {
    const textSanitized = sanitize(text, {
        allowedTags: ['b', 'i', 'em', 'strong', 'code', 'br', 's'],
        allowedAttributes: {},
        allowedIframeHostnames: [],
    });
    return text ? ReactHtmlParser(getWhatsAppFormatting(textSanitized)) : '';
};

export const getWhatsAppFormatting = (str: string, render?: { href: boolean }) => {
    let format = str;

    function is_alphanumeric(c: string) {
        var x = c.charCodeAt(0);
        return !!((x >= 65 && x <= 90) || (x >= 97 && x <= 122) || (x >= 48 && x <= 57));
    }

    function whatsappStyles(format: string, wildcard: string, opTag: string, clTag: string) {
        let indices: any[] = [];

        for (let i = 0; i < format?.length; i++) {
            if (wildcard === '`' && format[i] === '`' && format[i + 1] === '`' && format[i + 2] === '`') {
                if (indices.length % 2) {
                    if (format[i - 1] === ' ') {
                    } else {
                        if (typeof format[i + 1] == 'undefined') {
                            indices.push(i);
                        } else {
                            if (is_alphanumeric(format[i + 1])) {
                            } else {
                                indices.push(i);
                            }
                        }
                    }
                } else {
                    if (typeof format[i + 1] == 'undefined') {
                    } else {
                        if (format[i + 1] === ' ') {
                        } else {
                            if (typeof format[i - 1] == 'undefined') {
                                indices.push(i);
                            } else {
                                if (is_alphanumeric(format[i - 1])) {
                                } else {
                                    indices.push(i);
                                }
                            }
                        }
                    }
                }
            } else if (format[i] === wildcard && wildcard !== '`') {
                if (indices.length % 2) {
                    if (format[i - 1] === ' ') {
                    } else {
                        if (typeof format[i + 1] == 'undefined') {
                            indices.push(i);
                        } else {
                            if (is_alphanumeric(format[i + 1])) {
                            } else {
                                indices.push(i);
                            }
                        }
                    }
                } else {
                    if (typeof format[i + 1] == 'undefined') {
                    } else {
                        if (format[i + 1] === ' ') {
                        } else {
                            if (typeof format[i - 1] == 'undefined') {
                                indices.push(i);
                            } else {
                                if (is_alphanumeric(format[i - 1])) {
                                } else {
                                    indices.push(i);
                                }
                            }
                        }
                    }
                }
            } else {
                if (format[i].charCodeAt(i) === 10 && indices.length % 2) {
                    indices.pop();
                }
            }
        }

        if (indices.length % 2) {
            indices.pop();
        }

        let e = 0;

        indices.forEach(function (v: number, i) {
            if (wildcard === '`') {
                let t = i % 2 ? clTag : opTag;
                v += e;
                format =
                    i % 2
                        ? format.substring(0, v - 2) + t + format.substring(v + 1)
                        : format.substring(0, v) + t + format.substring(v + 3);
                e += t.length - 1;
            } else {
                let t = i % 2 ? clTag : opTag;
                v += e;
                format = format.substring(0, v) + t + format.substring(v + 1);
                e += t.length - 1;
            }
        });

        return format;
    }

    format = whatsappStyles(format, '_', '<i>', '</i>');
    format = whatsappStyles(format, '*', '<b>', '</b>');
    format = whatsappStyles(format, '*', '<strong>', '</strong>');
    format = whatsappStyles(format, '~', '<s>', '</s>');
    format = whatsappStyles(format, '`', '<code>', '</code>');
    format = format?.replace(/\n/gi, '<br>');
    format = format?.replace(/\u21B5/g, '<br/>');
    if (render?.href) {
        const urlRegex = /((https?:\/\/|www\.)[^\s<>]+)/g;
        format = format.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
    }

    return format;
};


